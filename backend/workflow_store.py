import os
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError


def _load_env_file() -> None:
    candidates = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / "scraper" / ".env",
    ]

    for path in candidates:
        if not path.exists():
            continue

        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))
        return


def _get_database_url() -> str:
    _load_env_file()
    database_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "SUPABASE_DB_URL or DATABASE_URL must be set for workflow storage."
        )
    return database_url


_engine: Optional[Engine] = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(_get_database_url(), future=True, pool_pre_ping=True)
    return _engine


def _serialize_node(node: Dict[str, Any], workflow_id: str, sort_order: int) -> Dict[str, Any]:
    return {
        "id": node["id"],
        "workflow_id": workflow_id,
        "sort_order": sort_order,
        "type": node.get("type"),
        "variant": node.get("variant"),
        "label": node.get("label"),
        "icon": node.get("icon"),
        "action_template_id": node.get("actionTemplateId"),
        "pos_x": node.get("x", 0),
        "pos_y": node.get("y", 0),
        "inputs": json.dumps(node.get("inputs") or {}),
        "config": json.dumps(node.get("config") or {}),
        "meta": json.dumps(node.get("meta") or {}),
    }


def _deserialize_node(row: Any) -> Dict[str, Any]:
    return {
        "id": row.id,
        "workflowId": row.workflow_id,
        "type": row.type,
        "variant": row.variant,
        "label": row.label,
        "x": row.pos_x,
        "y": row.pos_y,
        "icon": row.icon,
        "actionTemplateId": row.action_template_id,
        "inputs": row.inputs or {},
        "config": row.config or {},
        "meta": row.meta or {},
    }


def list_workflows(owner_email: str) -> List[Dict[str, Any]]:
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                select w.id, w.name, w.created_at, w.updated_at, count(n.id) as node_count
                from workflows w
                left join workflow_nodes n on n.workflow_id = w.id
                where w.owner_email = :owner_email
                group by w.id
                order by w.updated_at desc
                """
            ),
            {"owner_email": owner_email},
        ).fetchall()

    return [
        {
            "id": row.id,
            "name": row.name,
            "nodeCount": row.node_count,
            "createdAt": row.created_at.isoformat() if row.created_at else None,
            "updatedAt": row.updated_at.isoformat() if row.updated_at else None,
        }
        for row in rows
    ]


def get_workflow(owner_email: str, workflow_id: str) -> Optional[Dict[str, Any]]:
    engine = get_engine()
    with engine.connect() as conn:
        workflow = conn.execute(
            text(
                """
                select id, owner_email, name, created_at, updated_at
                from workflows
                where id = :workflow_id and owner_email = :owner_email
                """
            ),
            {"workflow_id": workflow_id, "owner_email": owner_email},
        ).mappings().first()

        if not workflow:
            return None

        nodes = conn.execute(
            text(
                """
                select id, workflow_id, sort_order, type, variant, label, icon,
                       action_template_id, pos_x, pos_y, inputs, config, meta
                from workflow_nodes
                where workflow_id = :workflow_id
                order by sort_order asc, created_at asc
                """
            ),
            {"workflow_id": workflow_id},
        ).fetchall()

    return {
        "id": workflow["id"],
        "name": workflow["name"],
        "nodes": [_deserialize_node(row) for row in nodes],
        "createdAt": workflow["created_at"].isoformat() if workflow["created_at"] else None,
        "updatedAt": workflow["updated_at"].isoformat() if workflow["updated_at"] else None,
    }


def save_workflow(owner_email: str, name: str, nodes: List[Dict[str, Any]], workflow_id: Optional[str] = None) -> Dict[str, Any]:
    engine = get_engine()

    try:
        with engine.begin() as conn:
            if workflow_id:
                existing = conn.execute(
                    text(
                        """
                        select id
                        from workflows
                        where id = :workflow_id and owner_email = :owner_email
                        """
                    ),
                    {"workflow_id": workflow_id, "owner_email": owner_email},
                ).first()

                if not existing:
                    raise ValueError("Workflow not found")

                conn.execute(
                    text(
                        """
                        update workflows
                        set name = :name, updated_at = now()
                        where id = :workflow_id and owner_email = :owner_email
                        """
                    ),
                    {
                        "workflow_id": workflow_id,
                        "owner_email": owner_email,
                        "name": name,
                    },
                )
                conn.execute(
                    text("delete from workflow_nodes where workflow_id = :workflow_id"),
                    {"workflow_id": workflow_id},
                )
            else:
                workflow_id = conn.execute(
                    text(
                        """
                        insert into workflows (owner_email, name)
                        values (:owner_email, :name)
                        returning id
                        """
                    ),
                    {"owner_email": owner_email, "name": name},
                ).scalar_one()

            if nodes:
                conn.execute(
                    text(
                        """
                        insert into workflow_nodes (
                            id, workflow_id, sort_order, type, variant, label, icon,
                            action_template_id, pos_x, pos_y, inputs, config, meta
                        )
                        values (
                            :id, :workflow_id, :sort_order, :type, :variant, :label, :icon,
                            :action_template_id, :pos_x, :pos_y, cast(:inputs as jsonb),
                            cast(:config as jsonb), cast(:meta as jsonb)
                        )
                        """
                    ),
                    [_serialize_node(node, workflow_id, index) for index, node in enumerate(nodes)],
                )

        workflow = get_workflow(owner_email, workflow_id)
        if not workflow:
            raise ValueError("Workflow not found after save")
        return workflow
    except SQLAlchemyError as exc:
        raise RuntimeError(f"Workflow storage failed: {exc}") from exc
