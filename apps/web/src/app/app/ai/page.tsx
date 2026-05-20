"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  TrendingUp, 
  Package, 
  DollarSign, 
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Trash2,
  UserCheck,
  Building,
  CreditCard,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";

// Component to render individual markdown chunks simply
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono font-bold text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownRenderer({ content }: { content: string }) {
  const paragraphs = content.split("\n");
  return (
    <div className="space-y-2">
      {paragraphs.map((para, idx) => {
        let text = para.trim();
        if (!text) return null;

        if (text.startsWith("###")) {
          return (
            <h3 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1.5 border-b pb-0.5 border-border/30">
              {text.replace("###", "").trim()}
            </h3>
          );
        }
        if (text.startsWith("##")) {
          return (
            <h2 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1.5">
              {text.replace("##", "").trim()}
            </h2>
          );
        }
        if (text.startsWith("-") || text.startsWith("*")) {
          const itemText = text.replace(/^[-*]\s*/, "");
          return (
            <li key={idx} className="list-disc ml-4 text-sm text-foreground/90">
              {renderFormattedText(itemText)}
            </li>
          );
        }
        if (/^\d+\.\s+/.test(text)) {
          const itemText = text.replace(/^\d+\.\s+/, "");
          return (
            <li key={idx} className="list-decimal ml-4 text-sm text-foreground/90">
              {renderFormattedText(itemText)}
            </li>
          );
        }

        return (
          <p key={idx} className="text-sm leading-relaxed text-foreground/95">
            {renderFormattedText(text)}
          </p>
        );
      })}
    </div>
  );
}

// Custom UI Cards for AI Database Actions (Wow factor)
function ActionsList({ actions }: { actions?: any[] }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 pt-3 border-t border-border/40">
      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        ZPOS AI - THỰC THI THÀNH CÔNG
      </div>
      {actions.map((act, i) => {
        const isSuccess = act.success;
        
        let actionTitle = "Thao tác cơ sở dữ liệu";
        let colorTheme = "bg-primary/5 border-primary/15 text-primary";
        let ActionIcon = FileText;
        let details = null;

        if (act.name === "create_product") {
          actionTitle = "Đã Thêm Sản Phẩm Mới";
          colorTheme = "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
          ActionIcon = Package;
          details = (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-[11px] font-semibold text-muted-foreground/80 bg-background/50 rounded-lg p-3 border border-border/10">
              <div className="col-span-2 text-foreground font-black text-xs pb-1 border-b border-border/20 mb-1">{act.args.name}</div>
              <div>Giá bán: <span className="text-foreground font-bold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(act.args.price)}</span></div>
              <div>Tồn kho: <span className="text-foreground font-bold">{act.args.stock} chiếc</span></div>
              <div>Mã SKU: <span className="text-primary font-mono font-bold uppercase">{act.result?.data?.barcode || "SP-AUTO"}</span></div>
              <div>Nhóm: <span className="text-foreground font-bold">{act.args.category_name || "Mặc định"}</span></div>
            </div>
          );
        } else if (act.name === "update_product") {
          actionTitle = "Đã Cập Nhật Sản Phẩm";
          colorTheme = "bg-sky-500/10 dark:bg-sky-500/5 border-sky-500/20 text-sky-600 dark:text-sky-400";
          ActionIcon = FileText;
          details = (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-[11px] font-semibold text-muted-foreground/80 bg-background/50 rounded-lg p-3 border border-border/10">
              <div className="col-span-2 text-foreground font-black text-xs pb-1 border-b border-border/20 mb-1">
                {act.result?.data?.name || act.args.product_name_or_id}
              </div>
              {act.args.price !== undefined && (
                <div>Giá mới: <span className="text-foreground font-bold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(act.args.price)}</span></div>
              )}
              {act.args.stock !== undefined && (
                <div>Tồn mới: <span className="text-foreground font-bold">{act.args.stock} chiếc</span></div>
              )}
            </div>
          );
        } else if (act.name === "delete_product") {
          actionTitle = "Đã Xoá Sản Phẩm";
          colorTheme = "bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400";
          ActionIcon = Trash2;
          details = (
            <div className="mt-2 text-[11px] text-muted-foreground bg-background/50 rounded-lg p-2.5 border border-border/10">
              Đã xoá hoàn toàn sản phẩm <span className="text-foreground font-bold">"{act.args.product_name_or_id}"</span> khỏi hệ thống.
            </div>
          );
        } else if (act.name === "create_customer") {
          actionTitle = "Đã Đăng Ký Khách Hàng Mới";
          colorTheme = "bg-violet-500/10 dark:bg-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400";
          ActionIcon = UserCheck;
          details = (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] font-semibold text-muted-foreground/80 bg-background/50 rounded-lg p-3 border border-border/10">
              <div className="col-span-2 text-foreground font-black text-xs pb-0.5 border-b border-border/20 mb-1">{act.args.name}</div>
              <div>Điện thoại: <span className="text-foreground font-bold">{act.args.phone || "Chưa có"}</span></div>
              <div>Mã KH: <span className="text-primary font-mono font-bold">KH-{act.result?.data?.id?.slice(0, 5) || "AUTO"}</span></div>
            </div>
          );
        } else if (act.name === "create_supplier") {
          actionTitle = "Đã Thêm Nhà Cung Cấp";
          colorTheme = "bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400";
          ActionIcon = Building;
          details = (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] font-semibold text-muted-foreground/80 bg-background/50 rounded-lg p-3 border border-border/10">
              <div className="col-span-2 text-foreground font-black text-xs pb-0.5 border-b border-border/20 mb-1">{act.args.name}</div>
              <div>Người liên hệ: <span className="text-foreground font-bold">{act.args.contact_name || "Chưa có"}</span></div>
              <div>Điện thoại: <span className="text-foreground font-bold">{act.args.phone || "Chưa có"}</span></div>
            </div>
          );
        } else if (act.name === "create_expense") {
          actionTitle = "Đã Ghi Nhận Chi Phí";
          colorTheme = "bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400";
          ActionIcon = CreditCard;
          details = (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] font-semibold text-muted-foreground/80 bg-background/50 rounded-lg p-3 border border-border/10">
              <div className="col-span-2 text-foreground font-black text-xs pb-0.5 border-b border-border/20 mb-1">{act.args.description}</div>
              <div>Số tiền: <span className="text-rose-500 font-bold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(act.args.amount)}</span></div>
              <div>Danh mục: <span className="text-foreground font-bold">{act.args.category || "Hành chính"}</span></div>
            </div>
          );
        }

        return (
          <div key={i} className={`p-3 rounded-lg border text-xs font-semibold flex flex-col gap-1 ${colorTheme}`}>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-background/80">
                <ActionIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-[11px]">{actionTitle}</p>
              </div>
              {isSuccess ? (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-none text-[10px] h-5 py-0 px-2 rounded-full font-bold">Thành công</Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] h-5 py-0 px-2 rounded-full font-bold">Thất bại</Badge>
              )}
            </div>
            {details}
          </div>
        );
      })}
    </div>
  );
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "👋 Xin chào! Tôi là Trợ lý Thông minh **ZPOS AI**.\n\nTôi có thể hỗ trợ bạn kiểm tra tình hình tài chính của quán, kiểm tra tồn kho, hoặc nhập liệu tự động cực nhanh bằng **Giọng nói** 🎙️.\n\n**Bạn có thể ra lệnh cho tôi như:**\n- `\"Thêm sản phẩm Trà Đào Cam Sả giá 35000 tồn kho 90\"`\n- `\"Thêm chi phí tiền điện nước tháng này 1500000\"`\n- `\"Thêm khách hàng Nguyễn Văn A số điện thoại 0912345678\"`\n- `\"Xóa sản phẩm có tên Trà Dâu\"`"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [quickStats, setQuickStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadVoices = () => {
        let vi: any[] = [];
        
        if (window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          vi = voices.filter(v => 
            v.lang.toLowerCase().includes("vi") || 
            v.lang.toLowerCase().includes("vn")
          ).map(v => ({
            name: v.name,
            id: v.name,
            lang: v.lang,
            nativeVoice: v
          }));
        }

        // Add premium virtual online voices
        const onlineVoices = [
          { name: "Google Dịch Free (Không cần Key)", id: "free-google-default", lang: "vi-VN" },
          { name: "Google Premium Neural2 (Nữ)", id: "gcloud-vi-VN-Neural2-A", lang: "vi-VN" },
          { name: "Google Premium Neural2 (Nam)", id: "gcloud-vi-VN-Neural2-D", lang: "vi-VN" },
          { name: "Google Premium WaveNet (Nữ)", id: "gcloud-vi-VN-Wavenet-A", lang: "vi-VN" },
          { name: "Google Premium WaveNet (Nam)", id: "gcloud-vi-VN-Wavenet-D", lang: "vi-VN" }
        ];

        const merged = [...vi, ...onlineVoices];
        setAvailableVoices(merged);

        if (merged.length > 0) {
          setSelectedVoiceName("free-google-default");
        }
      };

      loadVoices();
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "vi-VN"; 
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setInput(prev => (prev ? prev + " " + speechToText : speechToText));
          toast.success("Đã ghi nhận giọng nói của bạn!");
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Trình duyệt này không hỗ trợ nhận diện giọng nói hoặc chưa được cấp quyền micro.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text to Speech
  const toggleSpeech = (text: string, idx: number) => {
    if (typeof window === "undefined") return;

    if (speakingIdx === idx) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setSpeakingIdx(null);
      return;
    }

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clean markdown characters for pleasant speech reading
    const cleanText = text
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/[-*]\s*/g, ", ")
      .replace(/\d+\.\s+/g, ", ")
      .slice(0, 250);

    const playNativeFallback = (textToSpeak: string, messageIdx: number) => {
      console.warn("Playing speech via native SpeechSynthesis fallback...");
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setSpeakingIdx(null);
        toast.error("Trình duyệt của bạn không hỗ trợ speechSynthesis.");
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        const viVoice = window.speechSynthesis.getVoices().find(v => 
          v.lang.toLowerCase().includes("vi") || 
          v.lang.toLowerCase().includes("vn")
        );
        if (viVoice) {
          utterance.voice = viVoice;
        }

        utterance.onend = () => {
          setSpeakingIdx(null);
        };
        utterance.onerror = (e) => {
          console.error("Native SpeechSynthesis error:", e);
          if (utterance.voice) {
            console.warn("Retrying native SpeechSynthesis with default system voice...");
            try {
              const retryUtterance = new SpeechSynthesisUtterance(textToSpeak);
              retryUtterance.onend = () => {
                setSpeakingIdx(null);
              };
              retryUtterance.onerror = (err) => {
                console.error("Native SpeechSynthesis retry error:", err);
                setSpeakingIdx(null);
              };
              window.speechSynthesis.speak(retryUtterance);
            } catch (err) {
              setSpeakingIdx(null);
            }
          } else {
            setSpeakingIdx(null);
          }
        };

        setSpeakingIdx(messageIdx);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Native speech failed completely:", err);
        setSpeakingIdx(null);
      }
    };

    // If utilizing one of the Google API voices (Free Google Translate Proxy or Cloud API)
    if (selectedVoiceName.startsWith("gcloud-") || selectedVoiceName === "free-google-default") {
      setSpeakingIdx(idx);
      
      const payload = {
        text: cleanText,
        voiceName: selectedVoiceName
      };

      fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(async (res) => {
        if (!res.ok) {
          const textErr = await res.text();
          throw new Error(textErr || "Lỗi máy chủ TTS");
        }
        const data = await res.json();
        const audioSrc = data.audio || (data.audioContent ? "data:audio/mp3;base64," + data.audioContent : null);
        
        if (audioSrc) {
          const snd = new Audio(audioSrc);
          audioRef.current = snd;
          snd.play();
          snd.onended = () => {
            setSpeakingIdx(null);
          };
          snd.onerror = () => {
            console.error("Audio playback error, falling back...");
            playNativeFallback(cleanText, idx);
          };
        } else {
          throw new Error("Không có dữ liệu âm thanh trả về");
        }
      })
      .catch((err) => {
        console.error("Google TTS failed:", err);
        toast.error("Không kết nối được cổng giọng nói Google Premium. Chuyển sang giọng đọc mặc định...");
        playNativeFallback(cleanText, idx);
      });

    } else {
      // Local SpeechSynthesis (System voice)
      try {
        const found = availableVoices.find(v => v.id === selectedVoiceName);
        if (found && found.nativeVoice) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = found.nativeVoice;
          utterance.onend = () => {
            setSpeakingIdx(null);
          };
          utterance.onerror = (e) => {
            console.error(e);
            setSpeakingIdx(null);
          };
          setSpeakingIdx(idx);
          window.speechSynthesis.speak(utterance);
        } else {
          playNativeFallback(cleanText, idx);
        }
      } catch (err) {
        console.error(err);
        playNativeFallback(cleanText, idx);
      }
    }
  };

  // Fetch quick stats initially
  useEffect(() => {
    posService.getFinanceOverview()
      .then(data => setQuickStats(data))
      .catch(err => console.error("Failed to load initial quick stats", err));
  }, []);

  // Handle messages scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: textToSend }]);
    if (!forcedText) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: textToSend }] })
      });

      if (!response.ok) {
        throw new Error("Lỗi khi kết nối máy chủ AI");
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.content || data.reply || "Tôi đã nhận được lệnh nhưng không nhận diện được định dạng phản hồi phù hợp.",
        actions: data.actions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If speak trigger is enabled and TTS exists, play speaking automatically
      if (assistantMessage.content) {
        // Simple automatic play delay so user doesn't feel lag
        setTimeout(() => {
          toggleSpeech(assistantMessage.content, messages.length + 1);
        }, 300);
      }

      // If database was modified successfully, refresh live metrics immediately!
      if (data.actions && Array.isArray(data.actions)) {
        const hasSuccess = data.actions.some((a: any) => a.success);
        if (hasSuccess) {
          toast.success("Dữ liệu ZPOS đã được cập nhật thành công!");
          const freshData = await posService.getFinanceOverview();
          setQuickStats(freshData);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Lỗi kết nối máy chủ AI hoặc hệ thống bận. Xin vui lòng kiểm tra lại."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6 h-auto lg:h-[calc(100vh-140px)] lg:max-h-[calc(100vh-140px)] lg:min-h-0 animate-in fade-in duration-500">
      
      {/* PAGE HEADER (SYNCHRONIZED WITH THE ORIGINAL REPOSITORY UI) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Trợ lý AI Smart</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-0.5">
            <Bot className="w-4 h-4 text-violet-500" />
            Nhập liệu giọng nói thời gian thực và điều khiển hệ thống ZPOS tự động
          </p>
        </div>

        {/* Action Header Panel */}
        <div className="flex items-center gap-2">
          {availableVoices.length > 0 && (
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background text-xs font-semibold shadow-sm">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Giọng đọc:</span>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id} className="text-foreground bg-card font-bold">
                    {v.name.replace("Microsoft", "").replace("Apple", "").replace("Google", "").replace("TTS", "").trim()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-1.5 font-bold shadow-sm"
            onClick={() => {
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
              setMessages([{
                role: "assistant",
                content: "Cuộc hội thoại đã được đặt lại. Tôi đã sẵn sàng thực hiện các lệnh tiếp theo từ bạn."
              }]);
              setSpeakingIdx(null);
            }}
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            Đặt lại chat
          </Button>
        </div>
      </div>

      {/* CORE WORKSPACE GRID CONTAINER */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT PANEL: Chat Conversation Interface */}
        <div className="flex-1 flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden h-[600px] lg:h-full min-h-0">
          {/* Subtle panel header */}
          <div className="px-4 py-3 border-b bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-muted-foreground">Kênh tương tác trực tuyến</span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 font-bold border-none text-[10px] px-2 py-0.5 rounded">Active</Badge>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role !== 'user' && (
                  <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                    <Bot className="w-4 h-4 text-violet-600" />
                  </div>
                )}
                <div 
                  className={`rounded-lg p-4 max-w-[85%] border group relative transition duration-200 ${
                    m.role === 'user' 
                      ? 'bg-violet-600 text-white border-violet-700 rounded-tr-none font-medium' 
                      : 'bg-muted/40 border-border/80 rounded-tl-none'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (
                    <div>
                      <MarkdownRenderer content={m.content} />
                      <ActionsList actions={m.actions} />
                      
                      {/* Speaker Audio Reading Toggle Trigger */}
                      <button 
                        onClick={() => toggleSpeech(m.content, idx)}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition duration-300 p-1 rounded bg-background border border-border hover:bg-muted"
                        title={speakingIdx === idx ? "Dừng đọc" : "Đọc phản hồi AI"}
                      >
                        {speakingIdx === idx ? (
                          <VolumeX className="w-3 h-3 text-rose-500 animate-bounce" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow">
                    U
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                  <Bot className="w-4 h-4 text-violet-600 animate-bounce" />
                </div>
                <div className="rounded-lg p-3 bg-muted/20 border border-border/40 rounded-tl-none flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                  <span className="text-xs font-medium animate-pulse text-muted-foreground">AI đang thực thi lệnh và phân tích dữ liệu...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice active listening alert indicator strip */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 justify-center animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              🎙️ Đang lắng nghe giọng nói của bạn... Hãy nói khẩu lệnh!
            </div>
          )}

          {/* Quick Trigger Chips Bar */}
          <div className="px-4 py-2 border-t bg-muted/10 flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => handlePromptClick("thêm sản phẩm Bánh mì thịt giá 25000 tồn kho 50")}
              className="text-[11px] font-bold px-3 py-1 rounded-full border bg-background hover:bg-muted text-muted-foreground transition duration-150 flex items-center gap-1 shadow-sm"
            >
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              + Thêm sản phẩm mẫu
            </button>
            <button 
              onClick={() => handlePromptClick("thêm khách hàng Nguyễn Hoàng Nam số 0988223344")}
              className="text-[11px] font-bold px-3 py-1 rounded-full border bg-background hover:bg-muted text-muted-foreground transition duration-150 flex items-center gap-1 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-violet-500" />
              + Khách hàng mới
            </button>
            <button 
              onClick={() => handlePromptClick("thêm chi phí tiền điện 1200000")}
              className="text-[11px] font-bold px-3 py-1 rounded-full border bg-background hover:bg-muted text-muted-foreground transition duration-150 flex items-center gap-1 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5 text-rose-500" />
              + Thêm chi phí điện
            </button>
            <button 
              onClick={() => handlePromptClick("thêm nhà cung cấp Công ty ViZ Solutions")}
              className="text-[11px] font-bold px-3 py-1 rounded-full border bg-background hover:bg-muted text-muted-foreground transition duration-150 flex items-center gap-1 shadow-sm"
            >
              <Building className="w-3.5 h-3.5 text-amber-500" />
              + Nhà cung cấp mới
            </button>
          </div>

          {/* Main User Controls Box */}
          <div className="p-3 border-t flex gap-2 items-center bg-background/50 backdrop-blur-md">
            {/* Microphone Toggle Button */}
            <Button
              type="button"
              variant="outline"
              onClick={toggleListening}
              className={`w-10 h-10 p-0 rounded-md flex-shrink-0 border transition duration-200 ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-600 shadow" 
                  : "hover:bg-muted"
              }`}
              title="Nhập liệu bằng giọng nói (vi-VN)"
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-muted-foreground" />}
            </Button>

            <Input 
              placeholder="Nhập yêu cầu: 'thêm sản phẩm X giá Y tồn kho Z', 'thêm chi phí A Z'..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="h-10 rounded-md flex-grow font-semibold text-xs border focus-visible:ring-violet-600 px-3.5"
            />

            <Button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()}
              className="h-10 px-4 rounded-md shadow bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold flex-shrink-0"
            >
              Gửi
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: Live Finance Stats & Instruction widgets */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4 overflow-y-auto pr-1 lg:h-full lg:max-h-full min-h-0">
          
          {/* Instant Financial Overview Grid Card */}
          <Card className="border shadow-sm rounded-lg overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Dữ liệu tài chính tức thời
              </CardTitle>
              <CardDescription className="text-[10px] font-medium text-muted-foreground">Tự động cập nhật khi AI nhập liệu</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs font-semibold">
              <div className="border-b pb-2 last:border-0 last:pb-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tổng doanh thu</span>
                <p className="text-xl font-black text-primary mt-0.5">{formatCurrency(quickStats?.totalRevenue || 0)}</p>
              </div>
              <div className="border-b pb-2 last:border-0 last:pb-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Giá vốn hàng bán (COGS)</span>
                <p className="text-sm font-bold text-muted-foreground mt-0.5">-{formatCurrency(quickStats?.totalCOGS || 0)}</p>
              </div>
              <div className="border-b pb-2 last:border-0 last:pb-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Chi phí vận hành</span>
                <p className="text-sm font-bold text-destructive mt-0.5">-{formatCurrency(quickStats?.totalExpenses || 0)}</p>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider block">Lợi nhuận ròng thực tế</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-500 mt-0.5">{formatCurrency(quickStats?.netProfit || 0)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Voice instructions */}
          <Card className="border shadow-sm rounded-lg bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                Hướng dẫn ra lệnh giọng nói 🎙️
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-[11px] leading-relaxed font-semibold text-muted-foreground">
              <div className="p-2.5 bg-muted/40 rounded border border-border/40">
                <p className="font-bold text-foreground mb-0.5">1. Bật Microphone</p>
                <p>Click nút mic hình vuông bên cạnh thanh nhập liệu và cấp quyền truy cập mic.</p>
              </div>
              <div className="p-2.5 bg-muted/40 rounded border border-border/40">
                <p className="font-bold text-foreground mb-0.5">2. Nói khẩu lệnh rõ ràng</p>
                <p>Nói: <code className="text-violet-600 font-bold">"thêm sản phẩm trà đào cam sả giá 30000 tồn kho 80"</code>.</p>
              </div>
              <div className="p-2.5 bg-muted/40 rounded border border-border/40">
                <p className="font-bold text-foreground mb-0.5">3. Bấm Gửi để thực thi</p>
                <p>Lệnh nói sẽ điền vào ô chat. Bấm Gửi để AI tự động cập nhật cơ sở dữ liệu ZPOS!</p>
              </div>
            </CardContent>
          </Card>

          {/* Spoken Voices settings advice */}
          <Card className="border shadow-sm rounded-lg bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-violet-600">
                <Sparkles className="w-4 h-4" />
                Tải giọng Siri tiếng Việt miễn phí 🎙️
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-[11px] leading-relaxed font-semibold text-muted-foreground">
              <p>Apple cung cấp các giọng đọc Siri tiếng Việt cao cấp cực kỳ mượt mà cho macOS:</p>
              <div className="p-2.5 bg-muted/30 rounded border border-border/30 space-y-1 text-[10px]">
                <p><span className="text-violet-600 font-bold">1:</span> Mở <strong className="text-foreground">Cài đặt hệ thống (System Settings)</strong> trên Mac.</p>
                <p><span className="text-violet-600 font-bold">2:</span> Chọn <strong className="text-foreground">Trợ năng (Accessibility)</strong> → <strong className="text-foreground">Nội dung được nói</strong>.</p>
                <p><span className="text-violet-600 font-bold">3:</span> Chọn Giọng nói → <strong className="text-foreground">Quản lý giọng nói... (Manage Voices...)</strong> → Tải tiếng Việt Siri Premium.</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
