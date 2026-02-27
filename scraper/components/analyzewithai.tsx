import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as XLSX from "xlsx";
import { Eye } from "lucide-react";
type UploadMode = "manual" | "pdf" | "excel";

type SiteRow = {
  url: string;
  status: "idle" | "analyzing" | "done" | "error";
  authority?: AuthorityType;
  docType?: DocumentType;
  output?: any;
  error?: string;
    tier?: "core" | "support" | "directory" | "ignore";
};

type AuthorityType =
  | "judicial"        // Supreme Court, High Courts, District Courts
  | "quasi_judicial"  // NCLT, NGT, SAT, DRT, RERA, CGIT
  | "regulatory"     // SEBI, UGC, AICTE, NAAC
  | "legislative"    // India Code, Acts, Rules
  | "adr"            // ICA, IIAC, MCIA (arbitration)
  | "professional"   // Bar Councils, Associations
  | "technical"      // APIs, GitHub, tools
  | "unknown";

type DocumentType = "case" | "statute" | "regulation" | "order" | "unknown";
const DOMAIN_CLASSIFIER: {
  match: RegExp;
  authority: AuthorityType;
  docType: DocumentType;
}[] = [
  { match: /ecourts\.gov\.in/i, authority: "judicial", docType: "case" },
  { match: /sci\.gov\.in/i, authority: "judicial", docType: "case" },
  { match: /highcourt/i, authority: "judicial", docType: "case" },

  { match: /nclt\.gov\.in/i, authority: "quasi_judicial", docType: "case" },
  {
    match: /satweb\.sat\.gov\.in/i,
    authority: "quasi_judicial",
    docType: "case",
  },
  { match: /rera\./i, authority: "quasi_judicial", docType: "case" },

  {
    match: /indiacode\.nic\.in/i,
    authority: "legislative",
    docType: "statute",
  },
  {
    match: /legislative\.gov\.in/i,
    authority: "legislative",
    docType: "statute",
  },

  {
    match: /sebi\.gov\.in\/legal/i,
    authority: "regulatory",
    docType: "regulation",
  },
  {
    match: /sebi\.gov\.in\/enforcement/i,
    authority: "regulatory",
    docType: "order",
  },
];

async function extractExcelToJson(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const result: Record<string, any[]> = {};
  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    result[sheetName] = rows;
  });

  return {
    sheetNames: workbook.SheetNames,
    sheets: result,
  };
}

function isValidUrl(value: any) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^https?:\/\/.+/i.test(v) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v);
}

function normalizeUrl(value: string) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function extractUrlsFromWorkbook(workbookJson: {
  sheetNames: string[];
  sheets: Record<string, any[]>;
}) {
  const urls: string[] = [];
  for (const sheetName of workbookJson.sheetNames) {
    const rows = workbookJson.sheets[sheetName] || [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        const value = row[key];
        if (isValidUrl(value)) urls.push(normalizeUrl(value));
      }
    }
  }
  return Array.from(new Set(urls));
}

export function AnalyzeWithAIModal() {
  const [open, setOpen] = React.useState(false);

  const [mode, setMode] = React.useState<UploadMode>("manual");
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [manualUrls, setManualUrls] = React.useState<string>("");

  const [rows, setRows] = React.useState<SiteRow[]>([]);
  const [selectedOutput, setSelectedOutput] = React.useState<any>(null);
  const [filterAuthority, setFilterAuthority] = React.useState<
    AuthorityType | "all"
  >("all");

  const [filterDocType, setFilterDocType] = React.useState<
    DocumentType | "all"
  >("all");

  function resetAll() {
    setMode("excel");
    setFile(null);
    setError("");
    setLoading(false);
    setRows([]);
    setSelectedOutput(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetAll();
  }

 function acceptForMode(m: UploadMode) {
  if (m === "pdf") return "application/pdf";
  if (m === "excel") return ".xlsx,.xls,.csv";
  return "";
}

  function labelForMode(m: UploadMode) {
    return m === "pdf" ? "PDF" : "Excel / CSV";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError("");
  }

  async function extractPdfTextPlaceholder(file: File) {
    // Placeholder: plug PDF.js here later
    return `PDF selected: ${file.name}`;
  }
async function handleManualUrlsApply() {
    const urls = manualUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean)
      .map(normalizeUrl);

    if (urls.length === 0) {
      setError("Enter at least one URL.");
      return;
    }
console.log(urls);
   try {
   const url=urls[0]
      console.log(url);
      
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/run-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: "analyzeSite",
          inputs: { rootUrl: url },
          config: {},
          label: "Analyze Website",
        }),
      });

      const json = await response.json();
console.log(json);

      setRows((prev: any) =>
        prev.map((r: any) =>
          r.url === url ? { ...r, status: "done", output: json } : r
        )
      );

      setSelectedOutput(json);
    } catch (e: any) {
      // setRows((prev: any) =>
      //   prev.map((r: any) =>
      //     r.url === url ? { ...r, status: "error", error: String(e) } : r
      //   )
      // );
    }
    // setError("");
    // setRows(
    //   urls.map((url) => ({
    //     url,
    //     status: "idle",
    //     authority: "unknown",
    //     docType: "unknown",
    //   }))
    // );
  }

  async function handleExtract() {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "excel") {
        const workbookJson = await extractExcelToJson(file);
        const urls = extractUrlsFromWorkbook(workbookJson);
        setRows(
          urls.map((url) => {
            const matched = DOMAIN_CLASSIFIER.find((d) => d.match.test(url));

            return {
              url,
              status: "idle",
              authority: matched?.authority ?? "unknown",
              docType: matched?.docType ?? "unknown",
            };
          })
        );
      } else {
        const pdfText = await extractPdfTextPlaceholder(file);
        setRows([]);
        setSelectedOutput({ mode: "pdf", extractedText: pdfText });
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function analyze(url: string) {
    setRows((prev: any) =>
      prev.map((r: any) => (r.url === url ? { ...r, status: "analyzing" } : r))
    );

    try {
      console.log(url);
      
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/run-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: "analyzeSite",
          inputs: { rootUrl: url },
          config: {},
          label: "Analyze Website",
        }),
      });

      const json = await response.json();

      setRows((prev: any) =>
        prev.map((r: any) =>
          r.url === url ? { ...r, status: "done", output: json } : r
        )
      );

      setSelectedOutput(json);
    } catch (e: any) {
      setRows((prev: any) =>
        prev.map((r: any) =>
          r.url === url ? { ...r, status: "error", error: String(e) } : r
        )
      );
    }
  }

  async function analyzeAll() {
    for (const row of rows) {
      if (row.status === "idle") {
        await analyze(row.url);
      }
    }
  }
  function stripProtocolAndSlash(url: string) {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }

  function getUrlSubLabel(rawUrl: string) {
    try {
      const u = new URL(rawUrl);
      return stripProtocolAndSlash(`${u.hostname}${u.pathname}`);
    } catch {
      return stripProtocolAndSlash(rawUrl);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          style={{
            borderRadius: 10,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(20,20,24,0.9)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Analyze with AI
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
        />

        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(980px, calc(100vw - 32px))",
            maxHeight: "min(760px, calc(100vh - 40px))",
            overflow: "hidden",
            borderRadius: 14,
            background: "#0b0b10",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            color: "white",
            outline: "none",
            display: "grid",
            gridTemplateRows: "auto 1fr",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <Dialog.Title style={{ fontSize: 16, fontWeight: 700 }}>
                Analyze with AI
              </Dialog.Title>
              <Dialog.Description style={{ fontSize: 12, opacity: 0.8 }}>
                Upload Excel to list websites → Analyze each → View JSON output.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.8)",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* LEFT PANE */}
            <div style={{ padding: 16, overflow: "auto" }}>
              {/* Mode chooser */}
            
                 <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
               {[
                  { key: "manual", title: "Manual URLs", desc: "Paste one URL per line" },
                  { key: "excel", title: "Excel / CSV", desc: "Extract website URLs and analyze each." },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className=""
                    onClick={() => {
                      setMode(opt.key as UploadMode);
                      setFile(null);
                      setError("");
                    }}
                    style={{
                      padding: 12,
                      margin:12,
                      borderRadius: 12,
                      border:
                        mode === opt.key
                          ? "1px solid rgba(255,255,255,0.35)"
                          : "1px solid rgba(255,255,255,0.12)",
                      background:
                        mode === opt.key
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.03)",
                      color: "white",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{opt.desc}</div>
                  </button>
                ))}
                </div>

              {/* File input */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                  Selected type: <b>{labelForMode(mode)}</b>
                </div>

        {mode === "manual" ? (
                  <div>
                    <textarea
                      placeholder="https://example.com&#10;https://another.com/page"
                      value={manualUrls}
                      onChange={(e) => setManualUrls(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: 140,
                        borderRadius: 12,
                        border: "1px dashed rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)",
                        color: "white",
                        padding: 12,
                        fontSize: 13,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 12,
                      }}
                    >
                      <button
                        type="button"
                        onClick={resetAll}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleManualUrlsApply}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.12)",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Extract Html
                      </button>
                    </div>
                    </div>
  ) : (
                  <>
                    <label
                      style={{
                        display: "block",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px dashed rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="file"
                        accept={acceptForMode(mode)}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {file ? file.name : "Click to choose file"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                        {mode === "pdf"
                          ? "Accepts .pdf"
                          : "Accepts .xlsx, .xls, .csv"}
                      </div>
                    </label>
               {error ? (
                      <div
                        style={{ marginTop: 10, fontSize: 12, color: "#ff7676" }}
                      >
                        {error}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 12,
                      }}
                    >
                      <button
                        type="button"
                        onClick={resetAll}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>
                <button
                        type="button"
                        onClick={handleExtract}
                        disabled={loading}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.12)",
                          color: "white",
                          cursor: "pointer",
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {loading ? "Extracting..." : "Extract"}
                      </button>
                    </div>
                  </>
                )}


              </div>

              {/* URL list after excel extraction */}
              {rows.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      Websites ({rows.length})
                    </div>
                    <button
                      onClick={analyzeAll}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Analyze All
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <select
                      value={filterAuthority}
                      onChange={(e) =>
                        setFilterAuthority(e.target.value as any)
                      }
                      style={{
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: "#111",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.2)",
                        fontSize: 12,
                      }}
                    >
                      <option value="all">All Authorities</option>
                      <option value="judicial">Courts</option>
                      <option value="quasi_judicial">Tribunals</option>
                      <option value="regulatory">Regulators</option>
                      <option value="legislative">Legislation</option>
                      <option value="unknown">Unknown</option>
                    </select>

                    <select
                      value={filterDocType}
                      onChange={(e) => setFilterDocType(e.target.value as any)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: "#111",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.2)",
                        fontSize: 12,
                      }}
                    >
                      <option value="all">All Types</option>
                      <option value="case">Cases</option>
                      <option value="statute">Statutes</option>
                      <option value="regulation">Regulations</option>
                      <option value="order">Orders</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    {rows
                      .filter((row) =>
                        filterAuthority === "all"
                          ? true
                          : row.authority === filterAuthority
                      )
                      .filter((row) =>
                        filterDocType === "all"
                          ? true
                          : row.docType === filterDocType
                      )
                      .map((row: any) => (
                        <div
                          className="truncate"
                          key={row.url}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 110px",
                            gap: 10,
                            padding: 12,
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="truncate"
                              style={{ fontWeight: 700, fontSize: 13 }}
                            >
                              {getUrlSubLabel(row.url)}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                              Status: {row.status}
                            </div>

                            {row.status === "error" && row.error && (
                              <div style={{ fontSize: 12, color: "#ff7676" }}>
                                {row.error}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => analyze(row.url)}
                            disabled={row.status === "analyzing"}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,0.15)",
                              background:
                                row.status === "analyzing"
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(255,255,255,0.12)",
                              color: "white",
                              cursor: "pointer",
                              opacity: row.status === "analyzing" ? 0.7 : 1,
                            }}
                          >
                            {row.status === "analyzing" ? "..." : "Analyze"}
                          </button>

                          {/* Click to view output */}
                          {row.output && (
                            <button
                              onClick={() => setSelectedOutput(row.output)}
                              style={{
                                gridColumn: "1 / -1",
                                marginTop: 8,
                                padding: 8,
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.04)",
                                color: "white",
                                fontSize: 12,
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              View Output JSON
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANE: JSON Output */}
            <div
              style={{
                borderLeft: "1px solid rgba(255,255,255,0.10)",
                padding: 16,
                overflow: "auto",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 10 }}>
                Output JSON
              </div>

              {selectedOutput ? (
                <AnalysisViewer selectedOutput={selectedOutput} />
              ) : (
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Upload Excel and click Analyze to see results here.
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


type UrlInfo = {
  url: string;

  scope: "internal" | "external";
  // where the link points relative to root site

  detectedType: "html" | "pdf";
  // basic content type guess (used for ingestion strategy)

  confidence?: number;
  // optional: how sure we are about the role (0–1)
};


function AnalysisViewer({ selectedOutput }: { selectedOutput: any }) {
  // your backend shape: { status, actionId, result: { success, rootUrl, analysis: {...} } }

  const analysis = selectedOutput?.result?.analysis;
  console.log( selectedOutput?.result);
  
  const title =
    analysis?.metadata?.title || selectedOutput?.result?.rootUrl || "Result";
  const internal = analysis?.linkSamples?.internalUrlsSample || [];
  const external = analysis?.linkSamples?.externalUrlsSample || [];

  const discovered = React.useMemo(() => {
  return deriveDiscoveredLinks(internal, external);
}, [internal, external]);

  const [tab, setTab] = React.useState<"internal" | "external">("internal");
  const [showRaw, setShowRaw] = React.useState(false);

  const list = tab === "internal" ? internal : external;
  const [viewUrl, setViewUrl] = React.useState<string | null>(null);

  if (viewUrl) {
    return <PageTextViewer url={viewUrl} onBack={() => setViewUrl(null)} />;
  }

  function getUrlLabel(rawUrl: string) {
    try {
      const u = new URL(rawUrl);
      const path = u.pathname || "/";
      const parts = path.split("/").filter(Boolean);

      // Root page
      if (parts.length === 0) return "home";

      // last segment
      const last = parts[parts.length - 1];

      // Include query hint if you want (optional)
      // const q = u.search ? `?${u.searchParams.toString()}` : "";
      // return `${last}${q ? " (query)" : ""}`;

      return last;
    } catch {
      // If URL is malformed, just fallback
      const parts = rawUrl.split("/").filter(Boolean);
      return parts[parts.length - 1] || rawUrl;
    }
  }

function handleAdd(url: string, role: string) {
  console.log("INGEST:", { url, role });
  // later:
  // POST → backend → ingestion queue → Mongo (draft)
}

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
            {title}
          </div>
          {selectedOutput?.result?.rootUrl ? (
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              {selectedOutput.result.rootUrl}
            </div>
          ) : null}
        </div>

        <button
          onClick={() => setShowRaw((v: any) => !v)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            cursor: "pointer",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {showRaw ? "Hide Raw" : "Raw JSON"}
        </button>
      </div>
{analysis && (
  <DiscoveryPanel
    discovered={discovered}
    onAdd={handleAdd}
 
  />
)}
      {/* Quick stats */}
      {analysis ? (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            fontSize: 12,
            opacity: 0.9,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <div>
            HTTP: <b>{analysis.httpStatus}</b>
          </div>
          <div>
            JS heavy: <b>{String(analysis.likelyJsRendered)}</b>
          </div>
          <div>
            Captcha: <b>{String(analysis.captchaSignalsDetected)}</b>
          </div>
          <div>
            Robots: <b>{analysis.robotsTxt?.exists ? "Yes" : "No"}</b>
          </div>
          <div>
            Internal links:{" "}
            <b>
              {analysis.homepageLinks?.internalLinksFound ?? internal.length}
            </b>
          </div>
          <div>
            External links:{" "}
            <b>
              {analysis.homepageLinks?.externalLinksFound ?? external.length}
            </b>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => setTab("internal")}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border:
              tab === "internal"
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.12)",
            background:
              tab === "internal"
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.03)",
            color: "white",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Internal ({internal.length})
        </button>

        <button
          onClick={() => setTab("external")}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border:
              tab === "external"
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.12)",
            background:
              tab === "external"
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.03)",
            color: "white",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          External ({external.length})
        </button>
      </div>

      {/* List */}
      {!showRaw ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            overflow: "hidden",
          }}
        >
          {list.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, opacity: 0.75 }}>
              No {tab} URLs found.
            </div>
          ) : (
            list.slice(0, 200).map((url: string) => (
              <div
                key={url}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="truncate"
                  style={{
                    fontSize: 12,
                    opacity: 0.9,
                    wordBreak: "break-word",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      opacity: 0.95,
                    }}
                    title={url} // full url on hover
                  >
                    {/* {url} */}
                    {getUrlLabel(url)}
                  </div>
                  {/* {url} */}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  {/* <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      fontSize: 12,
                      textDecoration: "none",
                    }}
                  > */}
                  {/* <button onClick={() => setViewUrl(url)}>
<Eye  />


                  </button> */}

                  <button
                    onClick={() => setViewUrl(url)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.55)",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(-2px) scale(1.04)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow =
                        "0 18px 35px rgba(0,0,0,0.65)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 25px rgba(0,0,0,0.55)";
                    }}
                    aria-label="View"
                    title="View"
                  >
                    <Eye
                      size={20}
                      strokeWidth={2.3}
                      style={{
                        opacity: 0.92,
                        filter:
                          "drop-shadow(0 8px 16px rgba(255,255,255,0.14))",
                      }}
                    />
                  </button>

                  {/* </a> */}

                  <button
                    onClick={() => {
                      // placeholder for “Add to queue / Save”
                      console.log("ADD:", url);
                      alert(`Added: ${url}`);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.10)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <pre
          style={{
            marginTop: 12,
            marginBottom: 0,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            opacity: 0.9,
            borderRadius: 12,
            padding: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            maxHeight: 520,
            overflow: "auto",
          }}
        >
          {JSON.stringify(selectedOutput, null, 2)}
        </pre>
      )}
    </div>
  );
}

function PageTextViewer({ url, onBack }: { url: string; onBack: () => void }) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/run-node", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionId: "fetchText",
            inputs: { url, maxChars: 30000 },
            config: {},
            label: "Fetch Page Text",
          }),
        });

        const json = await res.json();
        if (!alive) return;

        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [url]);

  const title = data?.result?.title || url;
  const text = data?.result?.text || "";
  const httpStatus = data?.result?.httpStatus;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onBack}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{url}</div>
        </div>
      </div>

      {/* Stats card */}
      <div
        style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
          fontSize: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div>
          HTTP: <b>{httpStatus ?? "-"}</b>
        </div>
        <div>
          Chars: <b>{text.length}</b>
        </div>
      </div>

      {/* Raw text */}
      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ fontSize: 12, opacity: 0.75 }}>Loading page text…</div>
        ) : err ? (
          <div style={{ fontSize: 12, color: "#ff7676" }}>{err}</div>
        ) : (
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 520,
              overflow: "auto",
            }}
          >
            {text || "No text extracted."}
          </pre>
        )}
      </div>
    </div>
  );
}


type SubUrlRole =
  | "case_search"
  | "cause_list"
  | "judgment_list"
  | "pdf_document"
  | "directory"
  | "ignore";

const ROLE_LABELS: Record<SubUrlRole, string> = {
  case_search: "🔍 Case Search",
  cause_list: "📅 Cause Lists",
  judgment_list: "📄 Judgments / Orders",
  pdf_document: "📁 Direct PDFs",
  directory: "📚 Directories",
  ignore: "🚫 Ignored",
};

function deriveDiscoveredLinks(
  internal: string[],
  external: string[]
) {
  const discovered = {
    case_search: [] as UrlInfo[],
    cause_list: [] as UrlInfo[],
    judgment_list: [] as UrlInfo[],
    pdf_document: [] as UrlInfo[],
    directory: [] as UrlInfo[],
    ignore: [] as UrlInfo[],
  };

  function push(
    role: keyof typeof discovered,
    url: string,
    scope: "internal" | "external"
  ) {
    discovered[role].push({
      url,
      scope,
      detectedType: url.endsWith(".pdf") ? "pdf" : "html",
    });
  }

  const ALL = [
    ...internal.map((u) => ({ url: u, scope: "internal" as const })),
    ...external.map((u) => ({ url: u, scope: "external" as const })),
  ];

  for (const { url, scope } of ALL) {
    const u = url.toLowerCase();

    // PDFs
    if (u.endsWith(".pdf")) {
      push("pdf_document", url, scope);
      continue;
    }

    // Case search patterns
    if (
      u.includes("case") ||
      u.includes("casestatus") ||
      u.includes("search")
    ) {
      push("case_search", url, scope);
      continue;
    }

    // Cause list
    if (u.includes("cause") || u.includes("hearing")) {
      push("cause_list", url, scope);
      continue;
    }

    // Judgments / orders
    if (
      u.includes("judgment") ||
      u.includes("order") ||
      u.includes("decision")
    ) {
      push("judgment_list", url, scope);
      continue;
    }

    // Known legal directories / datasets
    if (
      u.includes("njdg") ||
      u.includes("scdg") ||
      u.includes("indiacode") ||
      u.includes("directory")
    ) {
      push("directory", url, scope);
      continue;
    }

    // Everything else
    push("ignore", url, scope);
  }

  return discovered;
}




export function DiscoveryPanel({
  discovered,
  onAdd,
}: {
  discovered: Partial<Record<SubUrlRole, UrlInfo[]>>;
  onAdd: (url: string, role: SubUrlRole) => void;


}) {
  if (!discovered) return null;
const [viewer, setViewer] = React.useState<{
  open: boolean;
  url?: string;
  loading?: boolean;
  content?: string;
  error?: string;
}>({ open: false });


async function handlePdfToMarkdown(url: string) {


  if(viewer.open===true){
  setViewer({ open: false, url, loading: false });  
  return
  }
  setViewer({ open: true, url, loading: true });

  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + "/run-node",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: "pdfTomarkdown",
          inputs: {
            source: url,
            returnMarkdown: true,
            maxChars: 30000,
          },
          config: {},
          label: "PDF to Markdown",
        }),
      }
    );

    const json = await res.json();

    setViewer({
      open: true,
      url,
      content: json?.result?.output?.markdown || "No content extracted",
    });
  } catch (e: any) {
    setViewer({
      open: true,
      url,
      error: String(e),
    });
  }
}






  function getPdfLabel(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "document.pdf";
  } catch {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || "document.pdf";
  }
}

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
        Detected Legal Entry Points
      </div>

      {(
        Object.entries(discovered) as [SubUrlRole, any[]][]
      ).map(([role, urls]) => {
        if (!urls || urls.length === 0) return null;

        const collapsed = role === "ignore" || role === "directory";

        return (
          <details key={role} open={!collapsed} style={{ marginBottom: 10 }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.9,
              }}
            >
              {ROLE_LABELS[role]} ({urls.length})
            </summary>

            <div style={{ marginTop: 6 }}>
              {urls.map(({ url }) => (
                <div
                  key={url}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px",
                    gap: 8,
                    padding: "6px 0",
                    alignItems: "center",
                  }}
                >
                <div
  style={{
    fontSize: 12,
    opacity: 0.9,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
  title={url}
>
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "#9ecbff",
        textDecoration: "underline",
        fontWeight: 600,
      }}
    >
      {getPdfLabel(url)}
    </a>
 
</div>


          <div style={{ display: "flex", gap: 6 }}>
  <button
  
  onClick={() => handlePdfToMarkdown(url)}

    style={{
      padding: "4px 6px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.08)",
      color: "white",
      fontSize: 11,
      cursor: "pointer",
    }}
  >
    {viewer.open == true ? (
`Close`
    ) : (
`View`
    )

    }
    
  </button>
</div>

                </div>
              ))}
            </div>
          

          </details>
        );
      })}
   {viewer.open && (
  <div
    style={{
      marginTop: 12,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.03)",
      padding: 12,
      maxHeight: 520,
      overflow: "auto",
      fontSize: 13,
      whiteSpace: "pre-wrap",
    }}
  >
    {viewer.loading && "Extracting PDF…"}
    {viewer.error && <span style={{ color: "#ff6b6b" }}>{viewer.error}</span>}
    {viewer.content}
  </div>
)}

    </div>
  );
}
