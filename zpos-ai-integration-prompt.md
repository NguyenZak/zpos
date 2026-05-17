# ZPOS AI Integration Prompt

## Security Notice

Never hardcode API keys.
Never expose API keys to the frontend.
Store API keys only in `.env.local`.

Use server-side only:
- Route Handlers
- Server Actions
- Edge Functions

Validate all input with Zod.
Use rate limiting.
Support multi-tenant AI isolation.

---

# Environment Variables

```env
GROQ_API_KEY=your_new_groq_api_key_here
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
```

---

# AI Features

## 1. AI Business Assistant

Route:

```txt
/app/ai
```

Features:

- AI business chat
- Revenue analysis
- Profit analysis
- Inventory analysis
- Expense analysis
- Staff performance analysis
- Branch performance analysis
- Smart recommendations

---

# 2. AI Sales Report

Route:

```txt
/reports/ai
```

Features:

- Auto generate sales reports
- Revenue summary
- Profit summary
- Top product summary
- Inventory alerts
- Business recommendations

---

# 3. AI Inventory Forecast

Route:

```txt
/inventory/ai-forecast
```

Features:

- Forecast low stock
- Predict inventory needs
- Detect slow-moving products
- Detect dead stock
- Suggest promotions

---

# 4. AI Purchase Suggestion

Route:

```txt
/purchases/ai-suggestions
```

Features:

- Suggest purchase quantities
- Suggest suppliers
- Detect abnormal supplier prices
- Auto draft purchase order

---

# 5. AI Expense Analysis

Route:

```txt
/finance/ai-analysis
```

Features:

- Expense analysis
- Abnormal cost detection
- Cost optimization
- Net profit impact analysis

---

# 6. AI Customer Insights

Route:

```txt
/customers/ai-insights
```

Features:

- Customer segmentation
- VIP customer detection
- Returning customer analysis
- Marketing suggestions
- SMS/Zalo/email content generation

---

# 7. AI Product Content

Route:

```txt
/products/[id]/ai
```

Features:

- Product description generation
- SEO content generation
- Facebook caption generation
- TikTok caption generation
- Translation support

---

# 8. AI Natural Language Query

Users can ask questions naturally.

Security requirements:

- Never allow raw SQL generation
- Use predefined tools/functions
- Secure internal query layer only

---

# Required AI Tools

Create server-side tools:

```txt
getRevenueSummary
getProfitSummary
getTopProducts
getLowStockItems
getInventoryForecast
getExpenseSummary
getCustomerSegments
getBranchPerformance
createPurchaseDraft
generateProductContent
```

---

# AI Architecture

```txt
Client UI
→ AI Chat Component
→ /api/ai/chat
→ Auth check
→ Tenant check
→ Permission check
→ Tool router
→ Groq API
→ AI Response
```

---

# API Route

Create:

```txt
src/app/api/ai/chat/route.ts
```

Requirements:

- POST only
- Auth validation
- Tenant validation
- Permission validation
- Zod validation
- Rate limiting
- Streaming support
- Secure logging

---

# Example System Prompt

```txt
Bạn là AI Business Assistant của ZPOS.

Bạn giúp chủ cửa hàng phân tích:
- doanh thu
- lợi nhuận
- tồn kho
- khách hàng
- chi phí
- vận hành

Luôn trả lời bằng tiếng Việt rõ ràng và có cấu trúc.

Không bịa số liệu.

Nếu dữ liệu không đủ, hãy nói rõ.

Khi đưa khuyến nghị:
1. Vấn đề
2. Nguyên nhân
3. Hành động đề xuất
4. Mức độ ưu tiên

Chỉ được sử dụng dữ liệu của organization hiện tại.
Không truy cập tenant khác.
Không tạo SQL trực tiếp từ câu hỏi người dùng.
```

---

# UI Components

Create components:

```txt
AIChatPanel
AIInsightCard
AIReportSummary
AIForecastTable
AIPurchaseSuggestion
AIExpenseAlert
AICustomerSegmentCard
AIActionList
```

---

# Database Tables

Create tables:

```txt
ai_conversations
ai_messages
ai_insights
ai_usage_logs
ai_feature_flags
```

---

# Permissions

Create permissions:

```txt
ai.use
ai.view_reports
ai.inventory_forecast
ai.purchase_suggestion
ai.expense_analysis
ai.customer_insights
ai.generate_content
```

---

# Multi-Tenant Security

Requirements:

- Every AI request scoped by organization_id
- AI cannot access another tenant
- AI tools must validate tenant
- AI logs must store tenant context
- API keys never exposed
- RLS enabled for AI tables

---

# Recommended AI UI Pages

```txt
/app/ai
/reports/ai
/inventory/ai-forecast
/purchases/ai-suggestions
/finance/ai-analysis
/customers/ai-insights
```

---

# Future AI Features

```txt
AI voice assistant
AI smart notifications
AI WhatsApp assistant
AI sales prediction
AI fraud detection
AI branch ranking
AI employee performance analysis
AI automatic pricing suggestion
```

---

# Final Goal

Integrate AI into ZPOS as a production-ready AI Business Assistant using Groq API.

The AI system must be:
- Secure
- Multi-tenant
- Scalable
- Server-side only
- Business-focused
- Production-ready
- Realtime capable
