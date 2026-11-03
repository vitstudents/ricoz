import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  financialData?: any;
  suggestedActions?: string[];
  timestamp: Date;
}

export const Assistant: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hello! I am **LedgerAI**, your autonomous bookkeeping and reconciliation assistant. I compute deterministic analytics directly from your general ledger and multi-currency bank feeds. How can I assist with your financial close today?",
      suggestedActions: [
        "Why is there a $2,500 difference in our bank balance?",
        "Show all unmatched transactions from October",
        "How much did we spend on software subscriptions?",
        "Identify unusual payments this month"
      ],
      timestamp: new Date()
    }
  ]);

  const quickPrompts = [
    "Why is there a $2,500 difference in our bank balance?",
    "Show all unmatched transactions from October",
    "How much did we spend on software subscriptions?",
    "Identify unusual payments this month",
    "Explain foreign exchange differences",
    "Month-end financial close summary"
  ];

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askAssistant(q);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        intent: res.intent,
        financialData: res.financial_data,
        suggestedActions: res.suggested_actions,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Sorry, I encountered an error while processing your financial query: ${err.message}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base">LedgerAI Autonomous Bookkeeper</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ground Truth Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Deterministic balance calculations • Zero LLM financial hallucination</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Suggested:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs whitespace-nowrap transition cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-5 shadow-inner">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                isUser ? 'bg-indigo-600 text-white shadow-md' : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md'
              }`}>
                {isUser ? 'You' : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {m.text}
                </div>

                {/* Suggested Action Buttons if from Assistant */}
                {!isUser && m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested Inquiries:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((action, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleSend(action)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span>Querying general ledger & computing financial breakdown...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-lg"
      >
        <input
          type="text"
          placeholder="Ask anything about transactions, reconciliation discrepancies, or monthly expenses..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 px-3 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

