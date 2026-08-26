"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { api } from "@/lib/api";
import type { AssistantResponse, MatchResult, SkillGap, SkillRoi } from "@/types/api";
import { Card, ImportancePill, Pill } from "@/components/ui";

const SUGGESTIONS = [
  "What should I learn next?",
  "What jobs fit me?",
  "Why am I not matching senior backend roles?",
  "Explain my biggest skill gap",
];

type ChatEntry = { role: "user" | "assistant"; response?: AssistantResponse; text?: string };

function ResponseCard({ response }: { response: AssistantResponse }) {
  if (response.type === "skill_roi_cards") {
    const rows = response.data as SkillRoi[];
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.skill} className="rounded-lg border border-slate-100 p-3">
            <p className="text-sm font-medium text-slate-900">{r.skill}</p>
            <p className="text-xs text-slate-500">ROI {r.roi.toFixed(2)}</p>
          </div>
        ))}
      </div>
    );
  }
  if (response.type === "job_match_cards") {
    const rows = response.data as MatchResult[];
    return (
      <div className="mt-2 space-y-2">
        {rows.map((r) => (
          <div key={r.job_id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
            <span className="text-sm font-medium text-slate-900">{r.title} · {r.company}</span>
            <span className="text-sm font-semibold text-brand-700">{r.match_score}%</span>
          </div>
        ))}
      </div>
    );
  }
  if (response.type === "skill_gap_table") {
    const rows = response.data as SkillGap[];
    return (
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 5).map((g) => (
          <div key={g.skill} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{g.skill}</span>
            <ImportancePill importance={g.importance} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(msg: string) {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.assistantChat(msg);
      setMessages((prev) => [...prev, { role: "assistant", response: res }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">AI Career Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">Grounded in your actual profile and platform data — not a generic chatbot.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand-300">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {m.role === "user" ? (
              <div className="max-w-lg rounded-2xl bg-brand-600 px-4 py-2.5 text-sm text-white">{m.text}</div>
            ) : (
              <Card className="max-w-xl">
                <div className="flex items-start gap-2">
                  <Bot size={16} className="mt-0.5 text-brand-600" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{m.response?.message}</p>
                    {m.response && <ResponseCard response={m.response} />}
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-slate-400">Thinking...</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your matches, skills, or career path..."
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button onClick={() => send(input)} className="btn-primary"><Send size={16} /></button>
      </div>
    </div>
  );
}
