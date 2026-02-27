/* =========================================================
   CORE ENUMS
   ========================================================= */

export type Jurisdiction = "India" | "US" | "EU" | "UK" | "Other";

export type DocumentType =
  | "case"
  | "statute"
  | "regulation"
  | "order";

export type DocumentStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "vectorized";

export type TemplateType =
  | "case"
  | "statute"
  | "order";

/* =========================================================
   TEMPLATE DEFINITIONS
   ========================================================= */

export interface TemplateSectionDefinition {
  id: string;
  label: string;
  required: boolean;
  repeatable?: boolean;
}

export interface DocumentTemplate {
  template: TemplateType;
  docType: DocumentType;
  sections: TemplateSectionDefinition[];
}

/* ---------- Template A: Case ---------- */

export const CASE_TEMPLATE: DocumentTemplate = {
  template: "case",
  docType: "case",
  sections: [
    { id: "headnote", label: "Headnote", required: false },
    { id: "facts", label: "Facts", required: true },
    { id: "issues", label: "Issues", required: true },
    { id: "analysis", label: "Analysis", required: true },
    { id: "order", label: "Final Order", required: true }
  ]
};

/* ---------- Template B: Statute / Regulation ---------- */

export const STATUTE_TEMPLATE: DocumentTemplate = {
  template: "statute",
  docType: "statute",
  sections: [
    { id: "title", label: "Title", required: true },
    { id: "section", label: "Section", required: true, repeatable: true },
    { id: "subsection", label: "Sub-section", required: false, repeatable: true },
    { id: "schedule", label: "Schedule", required: false, repeatable: true }
  ]
};

/* ---------- Template C: Order / Circular ---------- */

export const ORDER_TEMPLATE: DocumentTemplate = {
  template: "order",
  docType: "order",
  sections: [
    { id: "background", label: "Background", required: false },
    { id: "directions", label: "Directions", required: true },
    { id: "applicability", label: "Applicability", required: true },
    { id: "effective_date", label: "Effective Date", required: true }
  ]
};

/* =========================================================
   SECTION + STRUCTURE
   ========================================================= */

export interface DocumentSection {
  sectionId: string;
  label: string;
  order: number;
  text: string;
}

/* Optional tree if you want hierarchy later */
export interface StructureNode {
  id: string;
  label: string;
  order: number;
  children?: StructureNode[];
}

/* =========================================================
   MAIN DOCUMENT (MongoDB SOURCE OF TRUTH)
   ========================================================= */
export type AuthorityType =
  | "judicial"
  | "quasi_judicial"
  | "regulatory"
  | "legislative"
  | "adr"
  | "professional"
  | "technical";

  export type level =
  "supreme" | "high" | "district" | "tribunal"
export type DataTier =
  | "core"        // cases, statutes, regulations
  | "support"     // ADR awards, policy docs
  | "directory"   // bar councils, lists
  | "ignore";     // APIs, GitHub, junk


export interface VectorizationConfig {
  includeSections?: string[];   // sectionIds
  excludeSections?: string[];
  chunkPreset?: "small" | "medium" | "large";
}


export interface LegalDocument {
  _id?: string; // Mongo ObjectId
  docId: string;
authority: {
  type: AuthorityType;
  name: string;        // "Supreme Court of India", "NCLT", "SEBI"
  level?: level;      
};
  title: string;
  template: TemplateType;
  docType: DocumentType;
  status: DocumentStatus;

  jurisdiction: Jurisdiction;
  court?: string;
  bench?: string[];

  date?: {
    decision?: string;
    amendment?: string;
    uploaded: string;
  };

  cleanText: string;
tier: DataTier;

  sections: DocumentSection[];
  structureTree?: StructureNode[];

  citations?: string[];
  sectionNumbers?: string[];
  parties?: string[];

  lawArea?: string[];
  topicTags?: string[];

  language: string;
  version: number;

  source: {
    url: string;
    scrapedAt: string;
  };

  audit: {
    createdBy: string;
    updatedBy: string;
    updatedAt: string;
  };
  vectorization?: VectorizationConfig;

}

/* =========================================================
   CHUNKING (DERIVED DATA)
   ========================================================= */

export type ChunkType =
  | "headnote"
  | "section"
  | "clause"
  | "paragraph";

export interface DocumentChunk {
  chunkId: string;
  docId: string;

  chunkText: string;
  chunkType: ChunkType;

  parentSectionId?: string;

  startOffset: number;
  endOffset: number;

  metadata: {
    template: TemplateType;
    docType: DocumentType;
    court?: string;
    lawArea?: string[];
    citation?: string;
  };
}

/* =========================================================
   MILVUS VECTOR RECORD
   ========================================================= */

export interface VectorChunk {
  chunkId: string;
  docId: string;

  embedding: number[];
  text: string;

  metadata: {
    template: TemplateType;
    docType: DocumentType;
    jurisdiction: Jurisdiction;
    court?: string;
    lawArea?: string[];
  };
}

/* =========================================================
   FRONTEND EDITOR STATE
   ========================================================= */
export type ValidationState =
  | "unvalidated"
  | "invalid"
  | "valid";

export interface EditorState {
  document: LegalDocument;
  template: DocumentTemplate;

  isDirty: boolean;
  selectedSectionId?: string;

  validation: {
  state: ValidationState;
  errors?: string[];
};

}
