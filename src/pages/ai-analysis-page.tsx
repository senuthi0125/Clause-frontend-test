import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Wand2,
  User,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

type Tab = "chat" | "analyze" | "generate";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

const DRAFT_TYPES = [
  { value: "service_agreement", label: "Service Agreement" },
  { value: "nda", label: "NDA" },
  { value: "employment", label: "Employment" },
  { value: "vendor", label: "Vendor" },
  { value: "licensing", label: "Licensing" },
  { value: "partnership", label: "Partnership" },
];

function fmt(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function riskBadgeClass(level?: string | null) {
  switch ((level || "").toLowerCase()) {
    case "high":   return "bg-red-100 text-red-700";
    case "medium": return "bg-amber-100 text-amber-700";
    case "low":    return "bg-green-100 text-green-700";
    default:       return "bg-slate-100 text-slate-600";
  }
}

function RiskBar({ score }: { score?: number | null }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  const colour = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Risk Score</span>
        <span className="font-semibold">{pct}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Analyse result card ──────────────────────────────────────────────────────

function AnalysisCard({ result }: { result: Record<string, unknown> }) {
  const [showClauses, setShowClauses] = useState(false);

  const riskLevel  = result.risk_level as string | undefined;
  const riskScore  = result.risk_score as number | undefined;
  const summary    = result.summary as string | undefined;
  const clauses    = result.extracted_clauses as string[] | undefined;
  const factors    = result.risk_factors as string[] | undefined;
  const recs       = result.recommendations as string[] | undefined;
  const keyInfo    = result.key_information as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">Analysis Result</p>
        {riskLevel && (
          <Badge className={riskBadgeClass(riskLevel)}>
            {riskLevel === "high"   && <ShieldAlert className="mr-1 h-3 w-3" />}
            {riskLevel === "medium" && <AlertTriangle className="mr-1 h-3 w-3" />}
            {riskLevel === "low"    && <ShieldCheck className="mr-1 h-3 w-3" />}
            {fmt(riskLevel)} Risk
          </Badge>
        )}
      </div>

      <RiskBar score={riskScore} />

      {summary && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {summary}
        </p>
      )}

      {/* Key info */}
      {keyInfo && Object.keys(keyInfo).length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(keyInfo).map(([k, v]) =>
            v ? (
              <div key={k} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{fmt(k)}</p>
                <p className="mt-0.5 text-sm text-slate-700">{String(v)}</p>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Risk factors */}
      {(factors?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Factors</p>
          <ul className="space-y-1.5">
            {factors!.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {(recs?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendations</p>
          <ul className="space-y-1.5">
            {recs!.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted clauses (collapsible) */}
      {(clauses?.length ?? 0) > 0 && (
        <div>
          <button
            onClick={() => setShowClauses((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
          >
            {showClauses ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Extracted Clauses ({clauses!.length})
          </button>
          {showClauses && (
            <ul className="mt-2 space-y-1.5">
              {clauses!.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Raw fallback */}
      {!summary && !clauses?.length && !recs?.length && (
        <pre className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AIAnalysisPage() {
  const [searchParams] = useSearchParams();
  const preselectedId   = searchParams.get("contractId") || "";

  const [tab, setTab] = useState<Tab>("chat");
  const [contracts, setContracts] = useState<Contract[]>([]);

  // ── Chat state ────────────────────────────────────────────────────────────
  const [chatQuestion,  setChatQuestion]  = useState("");
  const [chatContractId, setChatContractId] = useState(preselectedId);
  const [chatMessages,  setChatMessages]  = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi, I'm your Clause AI assistant. Ask me about contracts, clauses, risks, renewals, obligations, summaries, or any legal question.",
    },
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // ── Analyse state ─────────────────────────────────────────────────────────
  const [analyzeMode,      setAnalyzeMode]      = useState<"text" | "contract">("text");
  const [analyzeText,      setAnalyzeText]      = useState("");
  const [analyzeContractId, setAnalyzeContractId] = useState(preselectedId);
  const [analysisResult,   setAnalysisResult]   = useState<Record<string, unknown> | null>(null);
  const [loadingAnalyze,   setLoadingAnalyze]   = useState(false);

  // ── Generate state ────────────────────────────────────────────────────────
  const [draftType,       setDraftType]       = useState("nda");
  const [draftParties,    setDraftParties]    = useState("");
  const [draftTerms,      setDraftTerms]      = useState("");
  const [generatedDraft,  setGeneratedDraft]  = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const messagesEndRef    = useRef<HTMLDivElement | null>(null);

  // Load contracts
  useEffect(() => {
    api
      .listContracts("?per_page=100")
      .then((data) => setContracts(Array.isArray(data?.contracts) ? data.contracts : []))
      .catch(() => setContracts([]));
  }, []);

  // Sync preselected contract once contracts load
  useEffect(() => {
    if (preselectedId && contracts.length > 0) {
      setChatContractId(preselectedId);
      setAnalyzeContractId(preselectedId);
      // If navigated from contract details, switch to analyse tab and auto-run
      if (searchParams.get("contractId")) {
        setTab("analyze");
        setAnalyzeMode("contract");
      }
    }
  }, [contracts, preselectedId]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "chat") messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, tab]);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => {
      const t = c.contract_type || "other";
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name: fmt(name), count }));
  }, [contracts]);

  const selectedChatContract = useMemo(
    () => contracts.find((c) => c.id === chatContractId),
    [contracts, chatContractId]
  );

  // ── Chat ─────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    const q = chatQuestion.trim();
    if (!q || loadingChat) return;

    setError(null);
    setLoadingChat(true);

    const userMsg: ChatMessage  = { id: createId(), role: "user",      content: q };
    const pendingMsg: ChatMessage = { id: createId(), role: "assistant", content: "Thinking…", pending: true };

    const updatedMessages = [...chatMessages, userMsg, pendingMsg];
    setChatMessages(updatedMessages);
    setChatQuestion("");

    // Build history from messages before the pending one (exclude system greeting and pending)
    const history = chatMessages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const data = await api.chat(q, chatContractId || undefined, history);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? {
                ...m,
                content:
                  typeof data?.answer === "string" && data.answer.trim()
                    ? data.answer
                    : "I couldn't generate a response right now.",
                pending: false,
              }
            : m
        )
      );
    } catch {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? { ...m, content: "Sorry, the AI chat request failed. Please try again.", pending: false }
            : m
        )
      );
      setError("Chat failed — please try again.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  // ── Analyse ───────────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (loadingAnalyze) return;
    if (analyzeMode === "text" && !analyzeText.trim()) return;
    if (analyzeMode === "contract" && !analyzeContractId) return;

    setLoadingAnalyze(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let data;
      if (analyzeMode === "text") {
        data = await api.analyzeText(analyzeText);
      } else {
        data = await api.analyzeContract(analyzeContractId);
      }
      setAnalysisResult(data as Record<string, unknown>);
    } catch {
      setError("Analysis failed — please try again.");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const generateDraft = async () => {
    if (loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);

    try {
      const parties = draftParties
        .split("\n").map((n) => n.trim()).filter(Boolean).map((name) => ({ name }));
      const keyTerms = Object.fromEntries(
        draftTerms.split("\n").map((l) => l.split(":")).filter((p) => p.length >= 2)
          .map(([k, ...rest]) => [k.trim(), rest.join(":").trim()])
          .filter(([k, v]) => k && v)
      );
      const data = await api.generateDraft({ contract_type: draftType, parties, key_terms: keyTerms });
      setGeneratedDraft(data?.content || "");
    } catch {
      setError("Draft generation failed — please try again.");
    } finally {
      setLoadingGenerate(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell
      title="AI Analysis"
      subtitle="Contract chat, risk analysis, and draft generation powered by Gemini."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          { key: "chat",     icon: <Send className="h-4 w-4" />,     label: "Chat" },
          { key: "analyze",  icon: <Sparkles className="h-4 w-4" />, label: "Analyse" },
          { key: "generate", icon: <Wand2 className="h-4 w-4" />,    label: "Generate Draft" },
        ] as const).map(({ key, icon, label }) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setTab(key)}
          >
            {icon}
            <span className="ml-2">{label}</span>
          </Button>
        ))}
      </div>

      {/* ── CHAT TAB ────────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">Clause AI Chat</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Ask general contract questions or focus on a specific contract.
                </p>
              </div>
              <div className="w-full lg:max-w-sm">
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400"
                  value={chatContractId}
                  onChange={(e) => setChatContractId(e.target.value)}
                >
                  <option value="">All contracts / General question</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedChatContract && (
              <div className="pt-1">
                <Badge className="bg-violet-100 text-violet-700">
                  Asking about: {selectedChatContract.title}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex h-[70vh] min-h-[560px] flex-col bg-slate-50/60">
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                {chatMessages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[85%] items-start gap-3 sm:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isUser ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200"
                        }`}>
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
                        }`}>
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          {message.pending && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <textarea
                    className="min-h-[56px] w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask about risks, clauses, payment terms, renewals…"
                    rows={3}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">Enter to send · Shift+Enter for new line</p>
                    <Button onClick={sendChat} disabled={loadingChat || !chatQuestion.trim()} className="rounded-xl">
                      {loadingChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── ANALYSE TAB ─────────────────────────────────────────────────── */}
      {tab === "analyze" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>AI Risk Analysis</CardTitle>
            <p className="text-sm text-slate-500">
              Paste contract text or analyse a saved contract to get a full risk report.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setAnalyzeMode("text"); setAnalysisResult(null); }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  analyzeMode === "text"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => { setAnalyzeMode("contract"); setAnalysisResult(null); }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  analyzeMode === "contract"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Saved Contract
              </button>
            </div>

            {analyzeMode === "text" ? (
              <textarea
                className="min-h-44 w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-700 outline-none focus:border-violet-400"
                value={analyzeText}
                onChange={(e) => setAnalyzeText(e.target.value)}
                placeholder="Paste the full contract text here…"
              />
            ) : (
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400"
                value={analyzeContractId}
                onChange={(e) => setAnalyzeContractId(e.target.value)}
              >
                <option value="">— Select a contract —</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}

            <Button
              onClick={runAnalysis}
              disabled={
                loadingAnalyze ||
                (analyzeMode === "text" ? !analyzeText.trim() : !analyzeContractId)
              }
              className="rounded-xl"
            >
              {loadingAnalyze
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…</>
                : <><Sparkles className="mr-2 h-4 w-4" /> Run Analysis</>}
            </Button>

            {analysisResult && <AnalysisCard result={analysisResult} />}
          </CardContent>
        </Card>
      )}

      {/* ── GENERATE TAB ────────────────────────────────────────────────── */}
      {tab === "generate" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Generate Draft Contract</CardTitle>
            <p className="text-sm text-slate-500">
              Describe the contract type, parties, and key terms — AI will generate a full draft.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contract Type
              </label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
              >
                {DRAFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Parties <span className="font-normal normal-case text-slate-400">(one per line)</span>
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-violet-400"
                value={draftParties}
                onChange={(e) => setDraftParties(e.target.value)}
                placeholder={"Acme Corp\nJohn Smith"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Terms <span className="font-normal normal-case text-slate-400">(key: value, one per line)</span>
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-violet-400"
                value={draftTerms}
                onChange={(e) => setDraftTerms(e.target.value)}
                placeholder={"Duration: 12 months\nPayment: Net 30\nGoverning Law: Delaware"}
              />
            </div>

            <Button onClick={generateDraft} disabled={loadingGenerate} className="rounded-xl">
              {loadingGenerate
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                : <><Wand2 className="mr-2 h-4 w-4" /> Generate Draft</>}
            </Button>

            {generatedDraft && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Generated Draft</p>
                <textarea
                  className="min-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700 outline-none"
                  value={generatedDraft}
                  readOnly
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
