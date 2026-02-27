"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, ScanSearch, CalendarRange, Globe } from "lucide-react";

type Workflow = {
  id: string;
  name: string;
};

export default function HomePage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("document.cookie:", document.cookie)

    // Optional: extract auth-token value
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth-token="))
      ?.split("=")[1]

    console.log("auth-token:", token)
    async function fetchWorkflows() {
      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
        }

        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow`, {
          method: "GET",
          credentials: "include", // ✅ REQUIRED for cookies
          headers,
        })

        if (!res.ok) {
          console.log("ahh hell o");
        }

        const data = await res.json();
        setWorkflows(data);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, [router]);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-orange-600">
            My Workflows
          </h1>

          <Button
            onClick={() => router.push("/workflow/new")}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Create Workflow
          </Button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <p className="text-gray-500">Loading workflows...</p>
        ) : workflows.length === 0 ? (
          <EmptyState  />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-xl border p-4 hover:shadow-sm"
              >
                <h2 className="font-medium text-gray-900">{workflow.name}</h2>

                <button
                  onClick={() => router.push(`/workflow/${workflow.id}`)}
                  className="mt-3 text-sm font-medium text-orange-600 hover:underline"
                >
                  Open →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}



const WORKFLOW_TEMPLATES = [
  {
    id: "delhi-hc-judgments",
    name: "Delhi HC Judgments by Date",
    description: "Date range + captcha text solve",
    icon: CalendarRange,
    defaults: {
      url: "https://delhihighcourt.nic.in/app/judgement-dates-wise",
      solveCaptcha: true,
      captchaType: "number",
      selectors: {
        formFields: { "#from_date": "01-01-1976", "#to_date": "04-01-2026" },
        submitSelector: "#menu3 > div.col-12.col-sm-12.col-md-12.col-xl-4 > button",
        rowsSelector: "#registrarsTableValue tbody tr",
        captchaTextSelector: "#captcha-code",
        captchaInputSelector: "#captchaInput",
      },
    },
  }
];

function EmptyState() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundSelectors, setFoundSelectors] = useState<string[]>([]);
  const [dateFields, setDateFields] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

 const [sessionId, setSessionId] = useState<string | null>(null);
  const handleSelectTemplate = (tplId: string) => {
    const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTemplate(tplId);
    setFormValues(tpl.defaults);
    const templateFields = tpl.defaults?.selectors?.formFields || {};
    const templateDateFields = Object.keys(templateFields)
      .filter((key) => key.includes("from_date") || key.includes("to_date"))
      .map((selector) => ({
        selector,
        placeholder: selector.includes("from_date") ? "From date" : "To date",
        label: selector.includes("from_date") ? "from_date" : "to_date",
      }));
    setDateFields(templateDateFields);
    setError(null);
  };

  const updateField = (path: string, value: any) => {
    setFormValues((prev: any) => {
      const next = { ...(prev || {}) };
      const segments = path.split(".");
      let ref = next;
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        ref[key] = ref[key] || {};
        ref = ref[key];
      }
      ref[segments[segments.length - 1]] = value;
      return next;
    });
  };

  const handleScan = async () => {
    if (!scanUrl) {
      setError("Enter a URL to scan");
      return;
    }
    setIsScanning(true);
    setError(null);
    try {
      console.log('opeinng browser');
      
      const openResp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/run-node`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: "openBrowser",
          inputs: {},
          config: {},
        }),
      });
      console.log('success');
      
      const openData = await openResp.json();
      console.log(openData);
      
      if (!openResp.ok || openData?.status === "failed") {
        throw new Error(openData?.error || openData?.detail || "Failed to open browser");
      }
      const sessionId = openData?.result?.sessionId;
      if (!sessionId) {
        throw new Error("No sessionId returned from openBrowser");
      }
   setSessionId(sessionId);
      const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/run-node`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: "scanWebPage",
          inputs: { url: scanUrl, includeForms: true },
          config: { sessionId },
        }),
      });
      const data = await resp.json();
      console.log(data, 'this is scanned web page');
      
      if (!resp.ok) throw new Error(data.error || data.detail || "Scan failed");
      const selectors: string[] =
        data?.result?.forms?.flatMap((f: any) => f.inputs?.map((i: any) => i.selector))?.filter(Boolean) || [];
      setFoundSelectors(selectors);
      const firstForm = data?.result?.forms?.[0];
      const firstTable = data?.result?.tables?.[0];
      const inputs = firstForm?.inputs || [];
      const isDateField = (input: any) => {
        const name = (input?.name || "").toLowerCase();
        const id = (input?.id || "").toLowerCase();
        const placeholder = (input?.placeholder || "").toLowerCase();
        return (
          name.includes("from_date") ||
          name.includes("to_date") ||
          id.includes("from_date") ||
          id.includes("to_date") ||
          placeholder.includes("from date") ||
          placeholder.includes("to date")
        );
      };
      const dateInputs = inputs.filter(isDateField);
      const visibleInputs = dateInputs.length
        ? dateInputs
        : inputs.filter((input: any) => (input?.type || "").toLowerCase() !== "hidden");
      const formFields = visibleInputs.reduce((acc: Record<string, string>, input: any) => {
        if (!input?.selector) return acc;
        acc[input.selector] = "";
        return acc;
      }, {});
      const dateFieldsForUi = dateInputs.map((input: any) => ({
        selector: input.selector,
        placeholder: input.placeholder || input.name || "Date",
        label: input.name || input.id || "",
      }));
      setDateFields(dateFieldsForUi);
      const captchaInput = inputs.find((input: any) => {
        const name = (input?.name || "").toLowerCase();
        const id = (input?.id || "").toLowerCase();
        return name.includes("captcha") || id.includes("captcha");
      });
      const captchaTypes: string[] = data?.result?.captchaTypes || [];
      const captchaSelectors = data?.result?.captchaSelectors || {};
      const preferredCaptcha =
        captchaTypes.find((t) => ["recaptcha_v3", "recaptcha_v2_invisible", "recaptcha_v2", "hcaptcha", "turnstile"].includes(t)) ||
        captchaTypes.find((t) => ["math", "number", "text", "image", "normal"].includes(t)) ||
        "";
      const nextValues = {
        url: scanUrl,
        solveCaptcha: captchaTypes.length > 0,
        captchaType: preferredCaptcha,
        selectors: {
          formFields,
          submitSelector: firstForm?.submitSelector || "",
          rowsSelector: firstTable?.selector || "",
          captchaTextSelector: captchaSelectors?.textSelector || "",
          captchaInputSelector: captchaSelectors?.inputSelector || captchaInput?.selector || "",
        },
      };
      setFormValues(nextValues);
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
         if (!formValues?.url) {
        throw new Error("Missing target URL");
      }
      const inputs = {
        url: formValues.url,
        selectors: formValues.selectors || {},
        solveCaptcha: formValues.solveCaptcha,
        captchaType: formValues.captchaType,
      };
      const config = sessionId ? { sessionId } : {};
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/run-node", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionId: "solveAndPaginateHtml",
          inputs,
          config,
          label: "solveAndPaginateHtml",
        }),
      });
      const data = await response.json();
      if (!response.ok || data?.status === "failed") {
        throw new Error(data?.error || data?.detail || "Failed to start");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start");
    } finally {
      setIsStarting(false);
    }
  };
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-dashed p-6 w-full">
      <p className="text-center text-gray-400 text-sm uppercase tracking-[0.2em]">Workflow templates</p>

      <div className="space-y-3">
        {WORKFLOW_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon || Play;
          const active = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`w-full flex items-center gap-3 rounded-lg border px-4 py-4 text-left transition 
              ${active ? "border-orange-500 bg-[var(--card)] shadow-md" : "border-[var(--border)] bg-[var(--panel)] hover:border-orange-500"}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-orange-600" : "bg-[var(--panel-alt)]"}`}>
                <Icon size={18} className={active ? "text-black" : "text-[var(--muted)]"} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--text)]">{tpl.name}</div>
                <div className="text-xs text-[var(--muted)]">{tpl.description}</div>
              </div>
              {active && (
                <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-black">Selected</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <ScanSearch size={16} /> Auto-scan a page for form fields
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            className="flex-1 rounded border border-border bg-(--panel-alt) px-3 py-2 text-sm text-(--text)"
            placeholder="https://example.com"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
          />
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-black hover:bg-orange-500 disabled:opacity-60"
          >
            {isScanning ? "Scanning..." : "Scan page"}
          </button>
        </div>
        {foundSelectors.length > 0 && (
          <div className="text-xs text-muted">
            Found selectors:
            <div className="mt-1 flex flex-wrap gap-1">
              {foundSelectors.slice(0, 12).map((sel) => (
                <span
                  key={sel}
                  onClick={() => updateField("selectors.rowsSelector", sel)}
                  className="cursor-pointer rounded bg-(--panel-alt) px-2 py-1 text-(--text)"
                  title="Click to set as rowsSelector"
                >
                  {sel}
                </span>
              ))}
              {foundSelectors.length > 12 && <span className="px-2 py-1 text-gray-500">+ more</span>}
            </div>
          </div>
        )}
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>

      {formValues && (
        <div className="rounded-lg border border-border bg-(--panel) p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-(--text)">
            <Play size={16} /> Configure
          </div>

          <input
            className="w-full rounded border border-border bg-(--panel-alt) px-3 py-2 text-sm text-(--text)"
            placeholder="Target URL"
            value={formValues.url || ""}
            onChange={(e) => updateField("url", e.target.value)}
          />

          {dateFields.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {dateFields.map((input: any) => (
                <div key={input.selector} className="flex flex-col gap-1">
                  <input
                    type="date"
                    className="w-full rounded border border-border bg-(--panel-alt) px-3 py-2 text-sm text-(--text)"
                    placeholder={input.placeholder || "Date"}
                    value={formValues.selectors?.formFields?.[input.selector] || ""}
                    onChange={(e) => updateField(`selectors.formFields.${input.selector}`, e.target.value)}
                  />
                  <div className="text-[11px] text-[var(--muted)]">
                    Selector: {input.selector}
                  </div>
                </div>
              ))}
            </div>
          )}


          <input
            className="w-full rounded border border-border bg-(--panel-alt) px-3 py-2 text-sm text-[var(--text)]"
            placeholder="Submit selector"
            value={formValues.selectors?.submitSelector || ""}
            onChange={(e) => updateField("selectors.submitSelector", e.target.value)}
          />
          <input
            className="w-full rounded border border-border bg-[var(--panel-alt)] px-3 py-2 text-sm text-[var(--text)]"
            placeholder="Rows selector"
            value={formValues.selectors?.rowsSelector || ""}
            onChange={(e) => updateField("selectors.rowsSelector", e.target.value)}
          />
          <input
            className="w-full rounded border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2 text-sm text-[var(--text)]"
            placeholder="Captcha text selector"
            value={formValues.selectors?.captchaTextSelector || ""}
            onChange={(e) => updateField("selectors.captchaTextSelector", e.target.value)}
          />
          <input
            className="w-full rounded border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2 text-sm text-[var(--text)]"
            placeholder="Captcha input selector"
            value={formValues.selectors?.captchaInputSelector || ""}
            onChange={(e) => updateField("selectors.captchaInputSelector", e.target.value)}
          />

          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={!!formValues.solveCaptcha}
                onChange={(e) => updateField("solveCaptcha", e.target.checked)}
              />
              Solve captcha
            </label>
            <input
              className="w-full rounded border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2 text-sm text-[var(--text)]"
              placeholder="Captcha type (e.g., number)"
              value={formValues.captchaType || ""}
              onChange={(e) => updateField("captchaType", e.target.value)}
            />
          </div>

          <div className="text-xs text-[var(--muted)] bg-[var(--panel-alt)] p-2 rounded">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(formValues, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => handleStart()}
            className="w-full rounded-md bg-orange-600 px-5 py-2 text-sm font-medium text-black hover:bg-orange-500"
          >
            start
          </button>
        </div>
      )}

    </div>
  );
}



