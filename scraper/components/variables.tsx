 "use client";

import { Plus, Trash } from "lucide-react";
import { useState } from "react";

type VariableEnv = "GLOBAL" | "ENV";

export type Variable = {
  id: string;
  name: string;
  value: string;
  env: VariableEnv;
};

type Props = {
  variables: Variable[]
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>
}
export default function VariablesPanel({
        variables,
        setVariables}:Props) {
  //global variable logic

const addVariable = () => {
  setVariables(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      name: "",
      value: "",
      env: "GLOBAL",
    },
  ]);
};


  const updateVariable = (id: string, key: keyof Variable, value: any) => {
    setVariables(
      variables.map((v:any) => (v.id === id ? { ...v, [key]: value } : v))
    );
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v:any) => v.id !== id));
  };
  return (
    <div className="p-4 border rounded-md w-full max-w-lg">
      <h2 className="font-bold mb-4">Global Variables</h2>
      {variables.length === 0 && (
  <p className="text-sm text-muted-foreground">No global variables</p>
)}
      {variables.map((v:any) => (
        <div  key={v.id} className="flex gap-2 mb-2 items-center">
          <input
            type="text"
            placeholder="Name"
            className="border p-1 rounded w-24"
            value={v.name}
            onChange={e => updateVariable(v.id, "name", e.target.value)}
          />
          <input
            type="text"
            placeholder="Value"
            className="border p-1 rounded flex-1"
            value={v.value}
            onChange={e => updateVariable(v.id, "value", e.target.value)}
          />
          <select
            value={v.env}
            onChange={e => updateVariable(v.id, "env", e.target.value)}
            className="border p-1 rounded"
          >
            <option value="GLOBAL">GLOBAL</option>
            <option value="ENV">ENV</option>
          </select>
     
          <button onClick={() => removeVariable(v.id)}    className="text-red-500">
            <Trash size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addVariable}
        className="flex items-center gap-1 text-blue-600 font-medium mt-2"
      >
        <Plus size={16} /> Add Variable
      </button>
    </div>
  );
}
