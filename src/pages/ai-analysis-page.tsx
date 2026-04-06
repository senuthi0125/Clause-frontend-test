import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Users,
  GitBranch,
  ChevronRight,
  Bot,
  Sparkles,
  Send,
  Wand2,
  Copy,
  User,
  CheckCircle2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tab = "chat" | "analyze" | "generate";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Contracts", icon: FileText, href: "/contracts" },
  { label: "AI Analysis", icon: ShieldAlert, href: "/ai-analysis" },
  { label: "Conflict Detection", icon: ShieldCheck, href: "/conflict-detection" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Workflows", icon: GitBranch, href: "/workflows" },
  { label: "Admin", icon: Users, href: "/admin" },
];

const contractGroups = [
  { name: "Master Service Agreements", count: 18, color: "bg-orange-400" },
  { name: "Vendor Contracts", count: 9, color: "bg-emerald-400" },
  { name: "Employment Contracts", count: 14, color: "bg-violet-400" },
  { name: "NDAs", count: 22, color: "bg-sky-400" },
];

const tabs: {
  id: Tab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "chat",
    label: "Chat",
    description: "Ask questions about clauses and obligations",
    icon: Send,
  },
  {
    id: "analyze",
    label: "Analyze",
    description: "Run risk analysis on contract text",
    icon: Sparkles,
  },
  {
    id: "generate",
    label: "Generate",
    description: "Create a contract draft with AI",
    icon: Wand2,
  },
];

const contractTypeOptions = [
  { value: "service_agreement", label: "Service Agreement" },
  { value: "nda", label: "NDA" },
  { value: "employment", label: "Employment" },
  { value: "vendor", label: "Vendor" },
  { value: "licensing", label: "Licensing" },
  { value: "partnership", label: "Partnership" },
];

export default function AIAnalysisPage() {
  const [tab, setTab] = useState<Tab>("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [contractId, setContractId] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [analyzeText, setAnalyzeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | {
    summary: string;
    risk_score: number;
    risk_level: "low" | "medium" | "high";
    extracted_clauses: string[];
    recommendations: string[];
  }>(null);

  const [genType, setGenType] = useState("nda");
  const [genParties, setGenParties] = useState("");
  const [genTerms, setGenTerms] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      let reply =
        "I reviewed your question. Based on the available contract context, you should verify payment terms, termination rights, confidentiality obligations, and renewal dates before final approval.";

      if (userMessage.toLowerCase().includes("termination")) {
        reply =
          "The termination clause should clearly state notice period, breach conditions, cure period, and whether termination for convenience is allowed.";
      } else if (userMessage.toLowerCase().includes("payment")) {
        reply =
          "The payment language should specify invoice timing, due dates, accepted payment method, tax responsibility, and late fee treatment.";
      } else if (userMessage.toLowerCase().includes("risk")) {
        reply =
          "The biggest legal risks usually come from unclear liability caps, vague service levels, conflicting deadlines, and missing data protection obligations.";
      }

      if (contractId.trim()) {
        reply += ` I also considered the provided contract context ID: ${contractId.trim()}.`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setChatLoading(false);
    }, 900);
  };

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAnalysisResult({
        summary:
          "The submitted text contains moderate legal exposure due to vague termination conditions, undefined liability limits, and unclear payment timelines.",
        risk_score: 72,
        risk_level: "medium",
        extracted_clauses: [
          "Payment due within 45 business days from invoice approval.",
          "Either party may terminate the contract upon written notice.",
          "The vendor will maintain confidentiality of all business materials.",
          "Liability shall be limited except in cases of gross negligence.",
        ],
        recommendations: [
          "Clarify the exact payment timeline and invoice approval mechanism.",
          "Define termination notice period and valid reasons for termination.",
          "Add stronger confidentiality survival language after termination.",
          "Specify liability cap and carve-outs more precisely.",
        ],
      });
      setAnalyzing(false);
    }, 1200);
  };

  const handleGenerate = async () => {
    setGenerating(true);

    setTimeout(() => {
      const parties = genParties || "Party A, Party B";
      const terms = genTerms || "duration: 12 months\npayment: Net 30";

      const draft = `CONTRACT DRAFT

Contract Type: ${contractTypeOptions.find((t) => t.value === genType)?.label || genType}

Parties:
${parties}

Key Terms:
${terms}

1. Scope
This agreement defines the responsibilities, obligations, and rights of the parties involved.

2. Payment
The client shall pay all approved invoices according to the agreed payment schedule.

3. Confidentiality
Both parties agree to protect confidential information disclosed during the contract period.

4. Termination
This contract may be terminated according to the agreed notice period and applicable breach conditions.

5. Governing Law
This agreement shall be governed by the applicable laws specified by the parties.

Generated by Clause AI Assistant.`;

      setGeneratedDraft(draft);
      setGenerating(false);
    }, 1200);
  };

  const copyDraft = async () => {
    if (!generatedDraft) return;
    await navigator.clipboard.writeText(generatedDraft);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-slate-900 text-slate-100 lg:min-h-screen">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 via-blue-500 to-emerald-400 text-sm font-bold text-white">
                  C
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">clause</h1>
                  <p className="text-xs text-slate-400">
                    Contract lifecycle workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.href}
                      end={item.href === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition cursor-pointer",
                          isActive
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="px-6 pt-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
                <span>My Contracts</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="mt-3 flex-1 px-4">
              <div className="space-y-2 pb-6">
                {contractGroups.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                      <div>
                        <p className="text-sm text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">Tracked repository</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10"
                    >
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="m-4 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">
                  <Bot className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Clause AI Assistant</p>
                  <p className="text-xs text-slate-500">AI analysis support</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Summarize risk points and suggest safer clause wording.
                </p>
              </div>

              <Button className="mt-4 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Open AI Chatbot
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">AI-powered legal workspace</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  AI Analysis
                </h2>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm w-fit">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">Ashen</p>
                  <p className="text-xs text-slate-500">Legal Ops / Admin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            <div>
              <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                AI Assistant Workspace
              </h3>
              <p className="mt-2 text-lg text-slate-500">
                Chat, analyze contract text, and generate professional drafts with AI.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                const active = tab === tabItem.id;

                return (
                  <button
                    key={tabItem.id}
                    type="button"
                    onClick={() => setTab(tabItem.id)}
                    className={cn(
                      "rounded-[24px] border p-5 text-left transition",
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                    )}
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                      <Icon className={cn("h-5 w-5", active ? "text-white" : "text-blue-600")} />
                    </div>
                    <p className="text-base font-semibold">{tabItem.label}</p>
                    <p className={cn("mt-1 text-sm", active ? "text-white/80" : "text-slate-500")}>
                      {tabItem.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {tab === "chat" && (
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="flex h-[620px] flex-col">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Clause AI</p>
                        <p className="text-xs text-slate-500">
                          Ask anything about contracts and clauses
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Input
                        value={contractId}
                        onChange={(e) => setContractId(e.target.value)}
                        placeholder="Contract ID (optional - add for context)"
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {messages.length === 0 && !chatLoading ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-blue-50">
                          <Sparkles className="h-8 w-8 text-blue-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Start a conversation
                        </h4>
                        <p className="mt-2 text-sm text-slate-500">
                          Ask about payment terms, termination clauses, risks, or obligations.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex gap-3",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {message.role === "assistant" && (
                              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}

                            <div
                              className={cn(
                                "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                message.role === "user"
                                  ? "rounded-br-md bg-blue-600 text-white"
                                  : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700"
                              )}
                            >
                              {message.content}
                            </div>

                            {message.role === "user" && (
                              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200">
                                <User className="h-4 w-4 text-slate-600" />
                              </div>
                            )}
                          </div>
                        ))}

                        {chatLoading && (
                          <div className="flex gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex gap-1.5">
                                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.15s]" />
                                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.3s]" />
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-white px-6 py-4">
                    <div className="flex gap-3">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        className="h-12 rounded-2xl border-slate-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="h-12 rounded-2xl bg-blue-600 px-5 text-white hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {tab === "analyze" && (
              <div className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Analyze Contract Text</CardTitle>
                    <CardDescription>
                      Paste contract content to extract clauses, score risk, and get AI recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={analyzeText}
                      onChange={(e) => setAnalyzeText(e.target.value)}
                      rows={10}
                      placeholder="Paste contract text here for AI-powered analysis..."
                      className="min-h-[240px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <Button
                      onClick={handleAnalyze}
                      disabled={!analyzeText.trim() || analyzing}
                      className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {analyzing ? "Analyzing..." : "Analyze Contract"}
                    </Button>
                  </CardContent>
                </Card>

                {analysisResult && (
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Analysis Results</CardTitle>
                      <CardDescription>
                        AI-generated summary, extracted clauses, and suggested improvements.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                          Summary
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700">
                          {analysisResult.summary}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p className="text-4xl font-bold text-slate-900">
                            {analysisResult.risk_score}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                            Risk Score
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p
                            className={cn(
                              "text-4xl font-bold uppercase",
                              analysisResult.risk_level === "low" && "text-green-600",
                              analysisResult.risk_level === "medium" && "text-amber-600",
                              analysisResult.risk_level === "high" && "text-red-600"
                            )}
                          >
                            {analysisResult.risk_level}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                            Risk Level
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Extracted Clauses
                        </p>
                        <div className="space-y-2">
                          {analysisResult.extracted_clauses.map((clause, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                            >
                              <FileText className="mt-0.5 h-4 w-4 text-blue-500" />
                              <span className="text-sm text-slate-700">{clause}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Recommendations
                        </p>
                        <div className="space-y-2">
                          {analysisResult.recommendations.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4"
                            >
                              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">
                                {index + 1}
                              </div>
                              <span className="text-sm text-slate-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {tab === "generate" && (
              <div className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Generate Contract Draft</CardTitle>
                    <CardDescription>
                      Provide a contract type, parties, and key terms to generate a structured draft.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Contract Type
                      </label>
                      <select
                        value={genType}
                        onChange={(e) => setGenType(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                      >
                        {contractTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Parties (comma-separated)
                      </label>
                      <Input
                        value={genParties}
                        onChange={(e) => setGenParties(e.target.value)}
                        placeholder="e.g. Acme Corp, Widget Inc"
                        className="h-12 rounded-2xl border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Key Terms (one per line, key: value)
                      </label>
                      <textarea
                        value={genTerms}
                        onChange={(e) => setGenTerms(e.target.value)}
                        rows={6}
                        placeholder={`duration: 12 months\npayment: Net 30\ngoverning_law: Sri Lanka`}
                        className="min-h-[150px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {generating ? "Generating..." : "Generate Draft"}
                    </Button>
                  </CardContent>
                </Card>

                {generatedDraft && (
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Generated Draft</CardTitle>
                        <CardDescription>
                          AI-generated contract draft based on your inputs.
                        </CardDescription>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={copyDraft}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </CardHeader>

                    <CardContent>
                      <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                        {generatedDraft}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Draft ready for review and editing
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}