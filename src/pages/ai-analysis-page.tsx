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
import { AppCard } from "@/components/ui/app-card";
import { AppBadge } from "@/components/ui/app-badge";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { AppInput } from "@/components/ui/app-input";
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

function riskBadgeVariant(
  level?: string | null
): "rose" | "amber" | "emerald" | "slate" {
  switch ((level || "").toLowerCase()) {
    case "high":
      return "rose";
    case "medium":
      return "amber";
    case "low":
      return "emerald";
    default:
      return "slate";
  }
}

function RiskBar({ score }: { score?: number | null }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  const colour =
    pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Risk Score</span>
        <span className="font-semibold">{pct}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AnalysisCard({ result }: { result: Record<string, unknown> }) {
  const [showClauses, setShowClauses] = useState(false);

  const riskLevel = result.risk_level as string | undefined;
  const riskScore = result.risk_score as number | undefined;
  const summary = result.summary as string | undefined;
  const clauses = result.extracted_clauses as string[] | undefined;
  const factors = result.risk_factors as string[] | undefined;
  const recs = result.recommendations as string[] | undefined;
  const keyInfo = result.key_information as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-5 shadow-sm dark:border-violet-500/20 dark:bg-violet-500/10">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900 dark:text-white">
          Analysis Result
        </p>
        {riskLevel && (
          <AppBadge variant={riskBadgeVariant(riskLevel)}>
            {riskLevel === "high" && (
              <ShieldAlert className="mr-1 h-3 w-3" />
            )}
            {riskLevel === "medium" && (
              <AlertTriangle className="mr-1 h-3 w-3" />
            )}
            {riskLevel === "low" && (
              <ShieldCheck className="mr-1 h-3 w-3" />
            )}
            {fmt(riskLevel)} Risk
          </AppBadge>
        )}
      </div>

      <RiskBar score={riskScore} />

      {summary && (
        <p className="rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-300">
          {summary}
        </p>
      )}

      {keyInfo && Object.keys(keyInfo).length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(keyInfo).map(([k, v]) =>
            v ? (
              <div
                key={k}
                className="rounded-xl border border-violet-100 bg-white/80 px-3 py-2 dark:border-violet-500/20 dark:bg-white/5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {fmt(k)}
                </p>
                <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                  {String(v)}
                </p>
              </div>
            ) : null
          )}
        </div>
      )}

      {(factors?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Risk Factors
          </p>
          <ul className="space-y-1.5">
            {factors!.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(recs?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recommendations
          </p>
          <ul className="space-y-1.5">
            {recs!.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(clauses?.length ?? 0) > 0 && (
        <div>
          <button
            onClick={() => setShowClauses((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showClauses ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Extracted Clauses ({clauses!.length})
          </button>

          {showClauses && (
            <ul className="mt-2 space-y-1.5">
              {clauses!.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!summary && !clauses?.length && !recs?.length && (
        <pre className="overflow-x-auto rounded-xl border border-violet-100 bg-white/80 p-4 text-xs text-slate-600 dark:border-violet-500/20 dark:bg-white/5 dark:text-slate-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AIAnalysisPage() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("contractId") || "";

  const [tab, setTab] = useState<Tab>("chat");
  const [contracts, setContracts] = useState<Contract[]>([]);

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatContractId, setChatContractId] = useState(preselectedId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi, I'm your Clause AI assistant. Ask me about contracts, clauses, risks, renewals, obligations, summaries, or any legal question.",
    },
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  const [analyzeMode, setAnalyzeMode] = useState<"text" | "contract">("text");
  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzeContractId, setAnalyzeContractId] = useState(preselectedId);
  const [analysisResult, setAnalysisResult] =
    useState<Record<string, unknown> | null>(null);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);

  const [draftType, setDraftType] = useState("nda");
  const [draftParties, setDraftParties] = useState("");
  const [draftTerms, setDraftTerms] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api
      .listContracts("?per_page=100")
      .then((data) =>
        setContracts(Array.isArray(data?.contracts) ? data.contracts : [])
      )
      .catch(() => setContracts([]));
  }, []);

  useEffect(() => {
    if (preselectedId && contracts.length > 0) {
      setChatContractId(preselectedId);
      setAnalyzeContractId(preselectedId);

      if (searchParams.get("contractId")) {
        setTab("analyze");
        setAnalyzeMode("contract");
      }
    }
  }, [contracts, preselectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, tab]);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => {
      const t = c.contract_type || "other";
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({
      name: fmt(name),
      count,
    }));
  }, [contracts]);

  const selectedChatContract = useMemo(
    () => contracts.find((c) => c.id === chatContractId),
    [contracts, chatContractId]
  );

  const sendChat = async () => {
    const q = chatQuestion.trim();
    if (!q || loadingChat) return;

    setError(null);
    setLoadingChat(true);

    const userMsg: ChatMessage = {
      id: createId(),
      role: "user",
      content: q,
    };
    const pendingMsg: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: "Thinking…",
      pending: true,
    };

    setChatMessages((prev) => [...prev, userMsg, pendingMsg]);
    setChatQuestion("");

    const history = chatMessages
      .filter((m) => !m.pending)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

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
            ? {
                ...m,
                content:
                  "Sorry, the AI chat request failed. Please try again.",
                pending: false,
              }
            : m
        )
      );
      setError("Chat failed — please try again.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleChatKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

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

  const generateDraft = async () => {
    if (loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);

    try {
      const parties = draftParties
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const keyTerms = Object.fromEntries(
        draftTerms
          .split("\n")
          .map((l) => l.split(":"))
          .filter((p) => p.length >= 2)
          .map(([k, ...rest]) => [k.trim(), rest.join(":").trim()])
          .filter(([k, v]) => k && v)
      );

      const data = await api.generateDraft({
        contract_type: draftType,
        parties,
        key_terms: keyTerms,
      });

      setGeneratedDraft(data?.content || "");
    } catch {
      setError("Draft generation failed — please try again.");
    } finally {
      setLoadingGenerate(false);
    }
  };

  return (
    <AppShell
      title="AI Analysis"
      subtitle="Contract chat, risk analysis, and draft generation powered by Gemini."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {([
          {
            key: "chat",
            icon: <Send className="h-4 w-4" />,
            label: "Chat",
          },
          {
            key: "analyze",
            icon: <Sparkles className="h-4 w-4" />,
            label: "Analyse",
          },
          {
            key: "generate",
            icon: <Wand2 className="h-4 w-4" />,
            label: "Generate Draft",
          },
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

      {tab === "chat" && (
        <AppCard tone="soft" padded={false} className="overflow-hidden">
          <div className="border-b border-violet-100 px-6 pb-4 pt-6 dark:border-violet-500/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Clause AI Chat
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ask general contract questions or focus on a specific contract.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={chatContractId}
                  onChange={(e) => setChatContractId(e.target.value)}
                >
                  <option value="">All contracts / General question</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedChatContract && (
              <div className="pt-3">
                <AppBadge variant="violet">
                  Asking about: {selectedChatContract.title}
                </AppBadge>
              </div>
            )}
          </div>

          <div className="flex h-[70vh] min-h-[560px] flex-col bg-violet-50/40 dark:bg-violet-500/5">
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {chatMessages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] items-start gap-3 sm:max-w-[75%] ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isUser
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {isUser ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>

                        {message.pending && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating…
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-violet-100 bg-white/70 p-4 dark:border-violet-500/20 dark:bg-white/5 sm:p-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                <textarea
                  className="min-h-[56px] w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Ask about risks, clauses, payment terms, renewals…"
                  rows={3}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Enter to send · Shift+Enter for new line
                  </p>
                  <Button
                    onClick={sendChat}
                    disabled={loadingChat || !chatQuestion.trim()}
                    className="rounded-xl"
                  >
                    {loadingChat ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      )}

      {tab === "analyze" && (
        <AppCard tone="soft">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              AI Risk Analysis
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Paste contract text or analyse a saved contract to get a full risk
              report.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAnalyzeMode("text");
                  setAnalysisResult(null);
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  analyzeMode === "text"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                Paste Text
              </button>

              <button
                onClick={() => {
                  setAnalyzeMode("contract");
                  setAnalysisResult(null);
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  analyzeMode === "contract"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                Saved Contract
              </button>
            </div>

            {analyzeMode === "text" ? (
              <textarea
                className="min-h-44 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                value={analyzeText}
                onChange={(e) => setAnalyzeText(e.target.value)}
                placeholder="Paste the full contract text here…"
              />
            ) : (
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={analyzeContractId}
                onChange={(e) => setAnalyzeContractId(e.target.value)}
              >
                <option value="">— Select a contract —</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={runAnalysis}
              disabled={
                loadingAnalyze ||
                (analyzeMode === "text"
                  ? !analyzeText.trim()
                  : !analyzeContractId)
              }
              className="rounded-xl"
            >
              {loadingAnalyze ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>

            {analysisResult && <AnalysisCard result={analysisResult} />}
          </div>
        </AppCard>
      )}

      {tab === "generate" && (
        <AppCard tone="soft">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Generate Draft Contract
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Describe the contract type, parties, and key terms — AI will
              generate a full draft.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contract Type
              </label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
              >
                {DRAFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Parties{" "}
                <span className="font-normal normal-case text-slate-400">
                  (one per line)
                </span>
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                value={draftParties}
                onChange={(e) => setDraftParties(e.target.value)}
                placeholder={"Acme Corp\nJohn Smith"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Key Terms{" "}
                <span className="font-normal normal-case text-slate-400">
                  (key: value, one per line)
                </span>
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                value={draftTerms}
                onChange={(e) => setDraftTerms(e.target.value)}
                placeholder={
                  "Duration: 12 months\nPayment: Net 30\nGoverning Law: Delaware"
                }
              />
            </div>

            <Button
              onClick={generateDraft}
              disabled={loadingGenerate}
              className="rounded-xl"
            >
              {loadingGenerate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>

            {generatedDraft && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Generated Draft
                </p>
                <textarea
                  className="min-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  value={generatedDraft}
                  readOnly
                />
              </div>
            )}
          </div>
        </AppCard>
      )}
    </AppShell>
  );
}