import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get search parameters
    const title = searchParams.get("title") || "ZPOS — Retail Operating System";
    const description = searchParams.get("description") || "Modern POS system for multi-tenant retail chains.";
    const badge = searchParams.get("badge") || "ENTERPRISE SEO";
    const category = searchParams.get("category") || "Platform";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgb(15, 7, 29) 0%, rgb(7, 11, 75) 50%, rgb(10, 48, 110) 100%)",
            padding: "80px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Subtle neon glowing light points */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "rgba(16, 150, 229, 0.25)",
              filter: "blur(80px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-50px",
              left: "10%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background: "rgba(168, 85, 247, 0.2)",
              filter: "blur(70px)",
            }}
          />

          {/* Top Row: ZPOS Logo & Dynamic Category */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Elegant glassmorphic logo container */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "24px",
                  fontWeight: "bold",
                  boxShadow: "0 0 20px rgba(0, 198, 255, 0.4)",
                }}
              >
                Z
              </div>
              <span
                style={{
                  color: "white",
                  fontSize: "28px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                }}
              >
                ZPOS
              </span>
            </div>

            {/* Glowing Category Pill */}
            <div
              style={{
                display: "flex",
                padding: "8px 18px",
                borderRadius: "50px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#80bfef",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          </div>

          {/* Middle Body: Badge & Big Title & Subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              width: "100%",
              marginTop: "20px",
            }}
          >
            {/* Dynamic Glassmorphic Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  background: "rgba(168, 85, 247, 0.25)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  color: "#f857a6",
                  fontSize: "12px",
                  fontWeight: "900",
                  letterSpacing: "1.5px",
                }}
              >
                {badge}
              </span>
            </div>

            {/* Large dynamic title */}
            <h1
              style={{
                fontSize: "62px",
                fontWeight: "900",
                color: "white",
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: "-1.5px",
                display: "-webkit-box",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>

            {/* Small description text */}
            <p
              style={{
                fontSize: "22px",
                color: "#94a3b8",
                margin: 0,
                lineHeight: 1.5,
                fontWeight: "500",
                maxWidth: "950px",
                display: "-webkit-box",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {description}
            </p>
          </div>

          {/* Bottom Row: Domain Branding & Tech Integrations */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "24px",
            }}
          >
            <span
              style={{
                color: "#64748b",
                fontSize: "16px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              zpos.click — Retail Operating System
            </span>
            <div
              style={{
                display: "flex",
                gap: "20px",
                color: "#3b82f6",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              <span style={{ color: "#38ef7d" }}>● OFFLINE SYNC</span>
              <span style={{ color: "#00c6ff" }}>● MULTI-TENANT</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error("Failed to generate dynamic OG Image:", e);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
