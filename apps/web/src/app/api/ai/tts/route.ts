import { NextRequest, NextResponse } from "next/server";

// Helper to split text into chunks of maximum length without cutting words
function splitTextIntoChunks(text: string, maxLength: number = 180): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split text by whitespace, preserving the whitespace
  const words = text.split(/(\s+)/);

  for (const word of words) {
    if ((currentChunk + word).length > maxLength) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
    } else {
      currentChunk += word;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Resilient helper to fetch Google Translate TTS with automatic chunking and merging
async function fetchFreeGoogleTts(text: string, speedVal: number): Promise<Buffer> {
  const speedParam = speedVal >= 1.15 ? "1.15" : speedVal <= 0.85 ? "0.85" : "1.0";
  const chunks = splitTextIntoChunks(text, 180);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const freeTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}&ttsspeed=${speedParam}`;
    
    const res = await fetch(freeTtsUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Google Translate TTS chunk fetch failed with status ${res.status}: ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(buffers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text;
    const voice_id = body.voice_id || body.voiceName;
    const speed = body.speed;

    if (!text) {
      return NextResponse.json({ error: "Thiếu văn bản đầu vào" }, { status: 400 });
    }

    const speedVal = speed || 1.0;
    const voiceIdStr = String(voice_id || "free-google-default");

    // ========================================================
    // 1. GOOGLE CLOUD TTS PREMIUM (WITH KEY)
    // ========================================================
    if (voiceIdStr.startsWith("gcloud-")) {
      const googleVoiceName = voiceIdStr.replace("gcloud-", "");
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;

      // If the API Key is missing, fall back to our 100% Free Server-Side Google Proxy!
      if (!apiKey) {
        console.warn("[Google Cloud TTS] GOOGLE_CLOUD_API_KEY missing. Falling back to Free Google Translate Proxy...");
        try {
          const mergedBuffer = await fetchFreeGoogleTts(text, speedVal);
          const base64Str = mergedBuffer.toString("base64");
          const dataUrl = `data:audio/mpeg;base64,${base64Str}`;
          return NextResponse.json({ 
            audio: dataUrl, 
            audioContent: base64Str,
            is_fallback: true 
          });
        } catch (proxyErr: any) {
          console.error("Free Google Translate Proxy synthesis failed inside fallback:", proxyErr);
          return NextResponse.json({ 
            error: `Không thể kết nối máy chủ giọng nói Google: ${proxyErr.message}` 
          }, { status: 500 });
        }
      }

      console.log(`[Google Cloud TTS] Synthesizing: "${text.substring(0, 30)}..." using ${googleVoiceName}`);
      
      const gcloudUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      const response = await fetch(gcloudUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "vi-VN",
            name: googleVoiceName,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: speedVal,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Cloud TTS API Error:", errorData);
        return NextResponse.json({ 
          error: errorData.error?.message || "Lỗi khi gọi cổng dịch vụ Google Cloud TTS" 
        }, { status: response.status });
      }

      const result = await response.json();
      const audioContent = result.audioContent;

      if (!audioContent) {
        return NextResponse.json({ error: "Không nhận được dữ liệu âm thanh từ Google Cloud" }, { status: 500 });
      }

      // Return premium Base64 data URL - instant play, no range/CORS issues!
      const dataUrl = `data:audio/mpeg;base64,${audioContent}`;
      return NextResponse.json({ 
        audio: dataUrl,
        audioContent: audioContent
      });
    }

    // ==========================================
    // 2. FREE SERVER-SIDE GOOGLE TRANSLATE PROXY DIRECT
    // ==========================================
    console.log(`[Free Google TTS Proxy] Synthesizing: "${text.substring(0, 30)}..."`);
    try {
      const mergedBuffer = await fetchFreeGoogleTts(text, speedVal);
      const base64Str = mergedBuffer.toString("base64");
      const dataUrl = `data:audio/mpeg;base64,${base64Str}`;
      return NextResponse.json({ 
        audio: dataUrl,
        audioContent: base64Str
      });
    } catch (proxyErr: any) {
      console.error("[Google Proxy Fetch Exception]:", proxyErr);
      return NextResponse.json({ error: `Lỗi kết nối máy chủ dịch giọng nói: ${proxyErr.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error("TTS API Route Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi hệ thống máy chủ" }, { status: 500 });
  }
}
