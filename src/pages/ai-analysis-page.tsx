import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles, Wand2, User, Loader2 } from "lucide-react";
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

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AIAnalysisPage() {
  const [tab, setTab] = useState<Tab>("chat");
  const [contracts, setContracts] = useState<Contract[]>([]);

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatContractId, setChatContractId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi, I’m your Clause AI assistant. Ask me about contracts, clauses, risks, renewals, obligations, summaries, or general contract-related questions.",
    },
  ]);

  const [analyzeText, setAnalyzeText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const [draftType, setDraftType] = useState("nda");
  const [draftParties, setDraftParties] = useState("");
  const [draftTerms, setDraftTerms] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState("");

  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api
      .listContracts("?per_page=100")
      .then((data) => {
        setContracts(Array.isArray(data?.contracts) ? data.contracts : []);
      })
      .catch(() => {
        setContracts([]);
      });
  }, []);

  useEffect(() => {
    if (tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, tab]);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      const type = contract.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === chatContractId),
    [contracts, chatContractId]
  );

  const sendChat = async () => {
    const trimmedQuestion = chatQuestion.trim();
    if (!trimmedQuestion || loadingChat) return;

    setError(null);
    setLoadingChat(true);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmedQuestion,
    };

    const pendingMessage: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: "Thinking...",
      pending: true,
    };

    setChatMessages((prev) => [...prev, userMessage, pendingMessage]);
    setChatQuestion("");

    try {
      const data = await api.chat(trimmedQuestion, chatContractId || undefined);

      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                content:
                  typeof data?.answer === "string" && data.answer.trim()
                    ? data.answer
                    : "I couldn’t generate a response right now.",
                pending: false,
              }
            : message
        )
      );
    } catch {
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                content:
                  "Sorry, the AI chat request failed. Please try again.",
                pending: false,
              }
            : message
        )
      );
      setError("Chat failed");
    } finally {
      setLoadingChat(false);
    }
  };

  const runAnalysis = async () => {
    if (!analyzeText.trim() || loadingAnalyze) return;

    setLoadingAnalyze(true);
    setError(null);

    try {
      const data = await api.analyzeText(analyzeText);
      setAnalysisResult(data);
    } catch {
      setError("Analysis failed");
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
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const keyTerms = Object.fromEntries(
        draftTerms
          .split("\n")
          .map((line) => line.split(":"))
          .filter((parts) => parts.length >= 2)
          .map(([key, ...rest]) => [key.trim(), rest.join(":").trim()])
          .filter(([key, value]) => key && value)
      );

      const data = await api.generateDraft({
        contract_type: draftType,
        parties,
        key_terms: keyTerms,
      });

      setGeneratedDraft(data?.content || "");
    } catch {
      setError("Draft generation failed");
    } finally {
      setLoadingGenerate(false);
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

  return (
    <AppShell
      title="AI Analysis"
      subtitle="Use AI tools for contract chat, analysis, and draft generation."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={tab === "chat" ? "default" : "outline"}
          onClick={() => setTab("chat")}
        >
          <Send className="mr-2 h-4 w-4" />
          Chat
        </Button>

        <Button
          variant={tab === "analyze" ? "default" : "outline"}
          onClick={() => setTab("analyze")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze
        </Button>

        <Button
          variant={tab === "generate" ? "default" : "outline"}
          onClick={() => setTab("generate")}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </div>

      {tab === "chat" && (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl">Clause AI Chat</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Ask general contract questions or focus the chat on a specific
                  contract from your system.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
                  value={chatContractId}
                  onChange={(e) => setChatContractId(e.target.value)}
                >
                  <option value="">All contracts / General question</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedContract && (
              <div className="pt-1">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  Asking about: {selectedContract.title}
                </Badge>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex h-[70vh] min-h-[560px] flex-col bg-slate-50/60">
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
              >
                {chatMessages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[85%] items-start gap-3 sm:max-w-[75%] ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isUser
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-700 border border-slate-200"
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
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>

                          {message.pending && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Generating response
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
                    className="min-h-[56px] w-full resize-none border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask about contract risks, clauses, payment terms, renewals, obligations..."
                    rows={3}
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      Enter to send • Shift + Enter for a new line
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
          </CardContent>
        </Card>
      )}

      {tab === "analyze" && (
        <Card>
          <CardHeader>
            <CardTitle>Analyze Text</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <textarea
              className="min-h-40 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={analyzeText}
              onChange={(e) => setAnalyzeText(e.target.value)}
              placeholder="Paste contract text here"
            />

            <Button
              onClick={runAnalysis}
              disabled={loadingAnalyze || !analyzeText.trim()}
            >
              {loadingAnalyze ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Analyze
            </Button>

            {analysisResult && (
              <div className="space-y-4">
                {analysisResult.summary && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">
                        {analysisResult.summary}
                      </p>
                      {analysisResult.risk_level && (
                        <Badge className="bg-slate-100 text-slate-700">
                          {formatLabel(analysisResult.risk_level)}
                        </Badge>
                      )}
                    </div>

                    {analysisResult.risk_score != null && (
                      <p className="mt-2 text-sm text-slate-500">
                        Risk score: {analysisResult.risk_score}
                      </p>
                    )}
                  </div>
                )}

                {analysisResult.extracted_clauses?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-2 font-medium text-slate-900">
                      Extracted clauses
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {analysisResult.extracted_clauses.map(
                        (clause: string, index: number) => (
                          <li key={index}>{clause}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-2 font-medium text-slate-900">
                      Recommendations
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {analysisResult.recommendations.map(
                        (item: string, index: number) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {!analysisResult.summary &&
                  !analysisResult.extracted_clauses?.length &&
                  !analysisResult.recommendations?.length && (
                    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "generate" && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Draft</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
            >
              {DRAFT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={draftParties}
              onChange={(e) => setDraftParties(e.target.value)}
              placeholder="One party per line"
            />

            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
              value={draftTerms}
              onChange={(e) => setDraftTerms(e.target.value)}
              placeholder="key: value"
            />

            <Button onClick={generateDraft} disabled={loadingGenerate}>
              {loadingGenerate ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate
            </Button>

            {generatedDraft && (
              <textarea
                className="min-h-72 w-full rounded-md border border-slate-200 p-3 text-sm outline-none"
                value={generatedDraft}
                readOnly
              />
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}