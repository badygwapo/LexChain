'use client';
import { useState, useRef, useEffect } from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import SendIcon from '@mui/icons-material/Send';
import { isMockMode } from '@/lib/mocks/mode';
import { useRouter } from 'next/navigation';

const mockResponses = [
  'Based on the document, the contract term is 12 months with automatic renewal.',
  'The key parties involved are LexChain Corp and Acme Inc.',
  'There are 2 risk flags identified: auto-renewal without notice and unlimited liability.',
  'The monthly payment obligation is $5,000 due by the 15th of each month.',
];

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

export default function PortalChatbot({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Hi! Ask me anything about this document.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');

    if (isMockMode()) {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: mockResponses[Math.floor(Math.random() * mockResponses.length)] },
      ]);
      return;
    }

    setLoading(true);
    try {
      const answer = await askDocument(documentId, text);
      setMessages((m) => [...m, { from: 'bot', text: answer }]);
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'Sorry, I could not get an answer. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open document assistant"
        className="fixed bottom-24 right-4 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-[#1689F5] text-white shadow-[0_8px_20px_rgba(22,137,245,0.2)] hover:opacity-90 transition-opacity cursor-pointer"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-4 z-50 sm:w-[360px] h-[480px] flex flex-col bg-white rounded-[18px] border border-[var(--portal-border-soft)] shadow-[0_10px_40px_rgba(19,59,115,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--portal-border-soft)]">
        <span className="font-bold text-[var(--portal-navy)]">Ask Document</span>
        <div className="flex items-center gap-1">
          <button onClick={() => router.push(`/portal/documents/${documentId}/ask`)} aria-label="Open full page" className="text-[var(--portal-navy)] opacity-60 hover:opacity-100">
            <OpenInFullIcon fontSize="small" />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close document assistant" className="text-[var(--portal-navy)] opacity-60 hover:opacity-100">
            <CloseIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={msg.from === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                msg.from === 'user'
                  ? 'bg-[#1689F5] text-white rounded-[14px] rounded-br-sm p-3 text-sm max-w-[80%]'
                  : 'bg-[#EAF4FF] text-[var(--portal-navy)] rounded-[14px] rounded-bl-sm p-3 text-sm max-w-[80%]'
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" style={{ animationDelay: '0.15s' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#1689F5]" style={{ animationDelay: '0.3s' }} />
            <span className="ml-1">Thinking...</span>
          </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Suggested questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => setInput(question)} className="rounded-full border border-[var(--portal-border-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--portal-navy)] hover:bg-[#EAF4FF]">{question}</button>)}
          </div>
          <p className="mt-3 text-xs text-[#64748b]">AI-generated assistance. Review the original PDF before relying on an answer.</p>
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--portal-border-soft)]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a question..."
          className="flex-1 rounded-full border border-[var(--portal-border-soft)] px-4 py-2.5 text-sm outline-none"
        />
        <button
          onClick={send}
          aria-label="Send question"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1689F5] text-white"
        >
          <SendIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}
