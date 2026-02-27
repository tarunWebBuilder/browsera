import { useState, useCallback } from "react";

interface RunNodeHookProps {
  actionId: string;
  inputs: any;
  config?: any;
  label?: string;
}

export function useRunNode() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runNode = useCallback(async ({ actionId, inputs, config = {}, label }: RunNodeHookProps) => {
    if (!actionId) return;

    setRunning(true);
    setResult(null);
    setError(null);

    try {
      console.log("Payload:", { actionId, inputs, config, label });

      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL+"/run-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, inputs, config, label }),
      });

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { runNode, running, result, error };
}
