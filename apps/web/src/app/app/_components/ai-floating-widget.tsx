"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Bot, 
  X, 
  Send, 
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono font-bold text-primary">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function MarkdownRenderer({ content }: { content: string }) {
  const paragraphs = content.split('\n');
  return (
    <div className="space-y-1.5">
      {paragraphs.map((para, idx) => {
        let text = para.trim();
        if (!text) return null;

        if (text.startsWith('###')) {
          return <h3 key={idx} className="text-xs font-black text-foreground mt-2 mb-1">{text.replace('###', '').trim()}</h3>;
        }
        if (text.startsWith('##')) {
          return <h2 key={idx} className="text-sm font-black text-foreground mt-2 mb-1">{text.replace('##', '').trim()}</h2>;
        }
        if (text.startsWith('-') || text.startsWith('*')) {
          const itemText = text.replace(/^[-*]\s*/, '');
          return (
            <li key={idx} className="list-disc ml-3 text-[11px] text-foreground/90">
              {renderFormattedText(itemText)}
            </li>
          );
        }
        if (/^\d+\.\s+/.test(text)) {
          const itemText = text.replace(/^\d+\.\s+/, '');
          return (
            <li key={idx} className="list-decimal ml-3 text-[11px] text-foreground/90">
              {renderFormattedText(itemText)}
            </li>
          );
        }

        return (
          <p key={idx} className="text-[11px] leading-relaxed text-foreground/95">
            {renderFormattedText(text)}
          </p>
        );
      })}
    </div>
  );
}

export function AIFloatingWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: `### Xin chào! Tôi là Trợ lý AI ZPOS ⚡\nTôi có thể giúp bạn phân tích doanh thu, lợi nhuận, chi phí hoặc tồn kho của cửa hàng ngay lập tức.`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 80);
    }
  }, [messages, open]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput("");

    const userMessage = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.content || "Xin lỗi, hệ thống AI đang bận xử lý, xin thử lại sau."
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Không thể kết nối với máy chủ AI."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Floating Chat Container */}
      {open && (
        <Card className="w-[360px] h-[480px] bg-background/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-primary/20 rounded-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-primary to-primary-hover text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">ZPOS AI Assistant</h3>
                <span className="text-[9px] text-white/80 font-medium">Phân tích kinh doanh trực tiếp</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`rounded-xl p-3 max-w-[85%] border shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground border-primary/10 rounded-tr-none text-xs font-semibold'
                      : 'bg-muted/30 border-border rounded-tl-none'
                  }`}>
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="rounded-xl p-2.5 bg-muted/20 border rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-[10px] text-muted-foreground animate-pulse font-bold">AI đang phân tích...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 border-t bg-muted/10 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
            <button 
              onClick={() => handlePromptClick("doanh thu tháng này thế nào?")}
              className="text-[9px] font-bold px-2 py-1.5 rounded-full border bg-background hover:bg-muted whitespace-nowrap text-muted-foreground shadow-sm flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Doanh thu
            </button>
            <button 
              onClick={() => handlePromptClick("lợi nhuận ròng hiện tại?")}
              className="text-[9px] font-bold px-2 py-1.5 rounded-full border bg-background hover:bg-muted whitespace-nowrap text-muted-foreground shadow-sm flex items-center gap-1"
            >
              <DollarSign className="w-3 h-3 text-primary" /> Lợi nhuận
            </button>
            <button 
              onClick={() => handlePromptClick("sản phẩm nào sắp hết hàng?")}
              className="text-[9px] font-bold px-2 py-1.5 rounded-full border bg-background hover:bg-muted whitespace-nowrap text-muted-foreground shadow-sm flex items-center gap-1"
            >
              <Package className="w-3 h-3 text-amber-500" /> Tồn kho
            </button>
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t flex gap-2 bg-background">
            <Input 
              placeholder="Nhập câu hỏi của bạn..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="h-9 text-xs rounded-xl"
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()}
              className="h-9 w-9 rounded-xl shadow-lg shadow-primary/20"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Floating Action Button with breathing glow ring animation */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gradient-to-r from-primary to-primary-hover text-white rounded-full shadow-2xl flex items-center justify-center relative group hover:scale-105 active:scale-95 transition duration-300 focus:outline-none"
      >
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping group-hover:animate-none opacity-75" />
        <span className="absolute -inset-1 rounded-full border-2 border-primary/25 animate-pulse" />
        <Bot className="w-6 h-6 animate-bounce" />
      </button>
    </div>
  );
}
