'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

const suggestedQuestions = [
  'What are the key dates?',
  'Who are the parties?',
  'What should I review?',
];

type Message = { from: 'bot' | 'user'; text: string };

async function askDocument(id: string, question: string): Promise<string> {
  const res = await fetch(
    `/api/portal/proxy-post?path=${encodeURIComponent(`/documents/${id}/ask`)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      credentials: 'same-origin',
    },
  );

  if (!res.ok) throw new Error('Failed to get answer');
  const text = await res.text();
  if (!text) return 'No answer returned.';

  try {
    const data = JSON.parse(text);
    return data?.answer ?? data?.response ?? data?.message ?? JSON.stringify(data);
  } catch {
    return text;
  }
}

export default function AskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((current) => [...current, { from: 'user', text: question }]);
    setLoading(true);

    try {
      const answer = await askDocument(id, question);
      setMessages((current) => [...current, { from: 'bot', text: answer }]);
    } catch {
      setMessages((current) => [...current, { from: 'bot', text: 'Sorry, I could not get an answer. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full flex-col gap-4">
      <Link href={`/portal/documents/${id}`} className="flex w-fit items-center gap-1 text-sm font-bold text-[#64748b] hover:text-[#1689F5]">
        <ArrowBackIcon sx={{ fontSize: 18 }} /> Back to Document
      </Link>

      <div>
        <h1 className="text-[28px] font-black text-[#0C2B49]">Ask Document</h1>
        <p className="mt-1 text-sm text-[#64748b]">Ask anything about this document.</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-bold text-[#0C2B49]">Ask a question about this document</p>
            <p className="text-xs text-[#64748b]">Try: summarize main obligations, parties, or risk points.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={msg.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  msg.from === 'user'
                    ? 'bg-[#1689F5] text-white rounded-[14px] rounded-br-sm p-3 text-sm max-w-[80%]'
                    : 'bg-[#EAF4FF] text-[#0C2B49] rounded-[14px] rounded-bl-sm p-3 text-sm max-w-[80%]'
                }
              >
                {msg.text}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" style={{ animationDelay: '0.15s' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" style={{ animationDelay: '0.3s' }} />
            <span className="ml-1">Thinking...</span>
          </div>
        )}

        {messages.length === 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Suggested questions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => setInput(question)} className="rounded-full border border-[#E8F0F8] px-3 py-1.5 text-xs font-semibold text-[#0C2B49] hover:bg-[#EAF4FF]">{question}</button>)}
            </div>
            <p className="mt-3 text-xs text-[#64748b]">AI-generated assistance. Review the original PDF before relying on an answer.</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 rounded-full border border-[#E8F0F8] bg-white p-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="Type a question..."
          className="flex-1 bg-transparent px-3 text-sm text-[#0C2B49] outline-none placeholder:text-[#A0AAB8]"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          aria-label="Send question"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1689F5] text-white disabled:opacity-40"
          type="button"
        >
          <SendIcon sx={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}
