import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";
import { posService } from "@/services/pos.service";
import { createClient } from "@/utils/supabase/client";

// Helper to find or create product category
async function findOrCreateProductCategory(name: string) {
  const supabase = createClient();
  const cleanName = name.trim();
  
  // 1. Search for category
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", cleanName)
    .eq("is_active", true)
    .limit(1);
  
  if (cat && cat.length > 0) {
    return cat[0].id;
  }
  
  // 2. Create category
  const { data: newCat, error } = await supabase
    .from("categories")
    .insert({
      name: cleanName,
      is_active: true,
    })
    .select("id")
    .single();
  
  if (error) throw error;
  return newCat.id;
}

// Helper to find or create expense category
async function findOrCreateExpenseCategory(name: string) {
  const supabase = createClient();
  const cleanName = name.trim();
  
  // 1. Search for category
  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .ilike("name", cleanName)
    .limit(1);
  
  if (cat && cat.length > 0) {
    return cat[0].id;
  }
  
  // 2. Create category
  const { data: newCat, error } = await supabase
    .from("expense_categories")
    .insert({
      name: cleanName,
    })
    .select("id")
    .single();
  
  if (error) throw error;
  return newCat.id;
}

// Executor for AI Tool calls in the database
async function executeTool(name: string, args: any) {
  const supabase = createClient();
  
  if (name === "create_product") {
    const { name: prodName, price, stock, category_name } = args;
    let categoryId = null;
    if (category_name) {
      categoryId = await findOrCreateProductCategory(category_name);
    } else {
      const { data: cats } = await supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .limit(1);
      if (cats && cats.length > 0) {
        categoryId = cats[0].id;
      } else {
        categoryId = await findOrCreateProductCategory("Mặc định");
      }
    }
    
    // Generate simple SKU
    const random = Math.floor(1000 + Math.random() * 9000);
    const sku = `SP${random}`;
    
    const productData = {
      name: prodName,
      barcode: sku,
      price: Number(price),
      stock: Number(stock),
      category_id: categoryId,
      is_active: true,
    };
    
    const product = await posService.createProduct(productData);
    return {
      success: true,
      message: `Đã tạo sản phẩm '${prodName}' thành công. Mã SKU: ${sku}, Giá: ${price}đ, Tồn kho: ${stock}`,
      data: product,
    };
  }
  
  if (name === "update_product") {
    const { product_name_or_id, price, stock } = args;
    let product = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product_name_or_id);
    
    if (isUuid) {
      const { data } = await supabase.from("products").select("*").eq("id", product_name_or_id).single();
      product = data;
    } else {
      const { data } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${product_name_or_id}%`)
        .eq("is_active", true)
        .limit(1);
      if (data && data.length > 0) {
        product = data[0];
      }
    }
    
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm '${product_name_or_id}' trong hệ thống.`);
    }
    
    const updateData: any = {};
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    
    const updated = await posService.updateProduct(product.id, updateData);
    return {
      success: true,
      message: `Đã cập nhật sản phẩm '${product.name}' thành công.` + 
        (price !== undefined ? ` Giá mới: ${price}đ.` : "") + 
        (stock !== undefined ? ` Tồn kho mới: ${stock}.` : ""),
      data: updated,
    };
  }
  
  if (name === "delete_product") {
    const { product_name_or_id } = args;
    let product = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product_name_or_id);
    
    if (isUuid) {
      const { data } = await supabase.from("products").select("*").eq("id", product_name_or_id).single();
      product = data;
    } else {
      const { data } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${product_name_or_id}%`)
        .eq("is_active", true)
        .limit(1);
      if (data && data.length > 0) {
        product = data[0];
      }
    }
    
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm '${product_name_or_id}' trong hệ thống.`);
    }
    
    await posService.deleteProduct(product.id);
    return {
      success: true,
      message: `Đã xoá (ngừng hoạt động) sản phẩm '${product.name}' thành công.`,
      data: product,
    };
  }
  
  if (name === "create_customer") {
    const { name: custName, phone, points } = args;
    const customerData = {
      name: custName,
      phone: phone || null,
      points: Number(points || 0),
    };
    const customer = await posService.createCustomer(customerData);
    return {
      success: true,
      message: `Đã thêm khách hàng mới '${custName}' thành công. Số điện thoại: ${phone || "Chưa có"}, Điểm tích luỹ: ${points || 0}`,
      data: customer,
    };
  }
  
  if (name === "delete_customer") {
    const { customer_name_or_id } = args;
    let customer = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customer_name_or_id);
    
    if (isUuid) {
      const { data } = await supabase.from("customers").select("*").eq("id", customer_name_or_id).single();
      customer = data;
    } else {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.%${customer_name_or_id}%,phone.ilike.%${customer_name_or_id}%`)
        .limit(1);
      if (data && data.length > 0) {
        customer = data[0];
      }
    }
    
    if (!customer) {
      throw new Error(`Không tìm thấy khách hàng '${customer_name_or_id}' trong hệ thống.`);
    }
    
    await posService.deleteCustomer(customer.id);
    return {
      success: true,
      message: `Đã xoá khách hàng '${customer.name}' (SĐT: ${customer.phone || "Không có"}) thành công.`,
      data: customer,
    };
  }
  
  if (name === "create_supplier") {
    const { name: supName, contact_name, phone, address } = args;
    const supplierData = {
      name: supName,
      contact_name: contact_name || null,
      phone: phone || null,
      address: address || null,
    };
    const supplier = await posService.createSupplier(supplierData);
    return {
      success: true,
      message: `Đã thêm nhà cung cấp mới '${supName}' thành công. Điện thoại: ${phone || "Chưa có"}, Địa chỉ: ${address || "Chưa có"}`,
      data: supplier,
    };
  }
  
  if (name === "delete_supplier") {
    const { supplier_name_or_id } = args;
    let supplier = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supplier_name_or_id);
    
    if (isUuid) {
      const { data } = await supabase.from("suppliers").select("*").eq("id", supplier_name_or_id).single();
      supplier = data;
    } else {
      const { data } = await supabase
        .from("suppliers")
        .select("*")
        .ilike("name", `%${supplier_name_or_id}%`)
        .limit(1);
      if (data && data.length > 0) {
        supplier = data[0];
      }
    }
    
    if (!supplier) {
      throw new Error(`Không tìm thấy nhà cung cấp '${supplier_name_or_id}' trong hệ thống.`);
    }
    
    await posService.deleteSupplier(supplier.id);
    return {
      success: true,
      message: `Đã xoá nhà cung cấp '${supplier.name}' thành công.`,
      data: supplier,
    };
  }
  
  if (name === "create_expense") {
    const { title, amount, category_name, status } = args;
    let categoryId = null;
    if (category_name) {
      categoryId = await findOrCreateExpenseCategory(category_name);
    } else {
      const { data: cats } = await supabase.from("expense_categories").select("id").limit(1);
      if (cats && cats.length > 0) {
        categoryId = cats[0].id;
      } else {
        categoryId = await findOrCreateExpenseCategory("Khác");
      }
    }
    
    const expenseData = {
      title,
      amount: Number(amount),
      category_id: categoryId,
      status: status || "paid",
      expense_date: new Date().toISOString().split("T")[0],
    };
    
    const expense = await posService.createExpense(expenseData);
    return {
      success: true,
      message: `Đã ghi nhận chi phí vận hành '${title}' thành công. Số tiền: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)}, Trạng thái: ${status || "Đã thanh toán"}`,
      data: expense,
    };
  }
  
  throw new Error(`Hành động '${name}' không được hỗ trợ.`);
}

export async function POST(req: NextRequest) {
  try {
    // Determine the tenant slug from host header and set on global scope for server-side services
    const host = req.headers.get("host") || "";
    let activeTenant = "app";
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
    if (host && host !== mainDomain && host !== `www.${mainDomain}`) {
      const parts = host.split('.');
      if (parts.length > 1) {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'localhost:3000' && subdomain !== 'localhost') {
          activeTenant = subdomain;
        }
      }
    }
    if (typeof global !== "undefined") {
      (global as any).activeTenantSlug = activeTenant;
    }

    const body = await req.json();
    let messages = body.messages;
    
    // Support single message string or array of messages
    if (!messages || !Array.isArray(messages)) {
      if (body.message) {
        messages = [{ role: "user", content: body.message }];
      } else {
        messages = [];
      }
    }
    
    const lastMessage = messages[messages.length - 1]?.content || "";

    const apiKey = process.env.GROQ_API_KEY;
    const lowerMsg = lastMessage.toLowerCase();

    // 1. Gather all live data to answer contextually
    const [rev, profit, expenses, lowStock, segments] = await Promise.all([
      aiService.getRevenueSummary(),
      aiService.getProfitSummary(),
      aiService.getExpenseSummary(),
      aiService.getLowStockItems(),
      aiService.getCustomerSegments(),
    ]);

    const statsContext = `
Dữ liệu trực tiếp của hệ thống ZPOS:
- Tổng doanh thu: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rev.totalRevenue)}
- Số đơn hàng đã bán: ${rev.ordersCount} đơn
- Giá trị đơn hàng trung bình (AOV): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rev.averageOrderValue)}
- Giá vốn hàng bán (COGS): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.cogs)}
- Chi phí vận hành (Paid Expenses): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.expenses)}
- Lợi nhuận ròng (Net Profit): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.netProfit)}
- Biên lợi nhuận: ${profit.profitMargin.toFixed(1)}%
- Số sản phẩm sắp hết hàng (tồn kho < 5): ${lowStock.length} sản phẩm
- Số lượng khách hàng VIP: ${segments.find((s) => s.name === "Khách hàng VIP")?.count || 0}
`;

    // 2. If GROQ_API_KEY is available, we call the Groq API with Tool support!
    if (apiKey) {
      const systemPrompt = `Bạn là ZPOS AI Business Assistant - Trợ lý AI có toàn quyền truy cập dữ liệu và thực thi thao tác trực tiếp trên hệ thống của ZPOS.
Bạn có khả năng THÊM, SỬA, XOÁ dữ liệu bao gồm: Sản phẩm (products), Khách hàng (customers), Nhà cung cấp (suppliers) và Chi phí vận hành (expenses) bằng cách gọi các công cụ (tools) được cung cấp.

Hãy sử dụng ngữ cảnh dữ liệu kinh doanh trực tiếp của cửa hàng sau đây để trả lời các câu hỏi của người dùng hoặc thực hiện thao tác tương ứng:
${statsContext}

Quy trình hoạt động:
1. Khi người dùng ra lệnh thêm, sửa, hoặc xoá dữ liệu (ví dụ: "Thêm sản phẩm bánh mì giá 15k tồn kho 20" hoặc "Xoá sản phẩm X"), hãy gọi ngay công cụ thích hợp được cấu hình.
2. Sau khi có kết quả trả về từ công cụ, hãy phản hồi lại cho người dùng bằng tiếng Việt thân thiện, rõ ràng, thông báo cụ thể kết quả hành động đã thực hiện.
3. Luôn sử dụng tiếng Việt lịch sự, có cấu trúc Markdown đẹp mắt.
4. Không được tự bịa số liệu nằm ngoài thống kê được cung cấp ở trên.
5. Khi đưa ra khuyến nghị kinh doanh thông thường, hãy phân tích theo: 1. Vấn đề, 2. Nguyên nhân, 3. Đề xuất hành động, 4. Mức độ ưu tiên.`;

      const tools = [
        {
          type: "function",
          function: {
            name: "create_product",
            description: "Thêm sản phẩm mới vào hệ thống ZPOS",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Tên đầy đủ của sản phẩm" },
                price: { type: "number", description: "Giá bán sản phẩm (VND)" },
                stock: { type: "number", description: "Số lượng tồn kho ban đầu" },
                category_name: { type: "string", description: "Tên danh mục sản phẩm (ví dụ: Nước ngọt, Đồ ăn vặt, Thiết bị)" }
              },
              required: ["name", "price", "stock"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "update_product",
            description: "Cập nhật giá hoặc số lượng tồn kho của một sản phẩm trong hệ thống ZPOS",
            parameters: {
              type: "object",
              properties: {
                product_name_or_id: { type: "string", description: "Tên sản phẩm hoặc ID sản phẩm cần cập nhật" },
                price: { type: "number", description: "Giá bán mới cần thay đổi (nếu có)" },
                stock: { type: "number", description: "Số lượng tồn kho mới cần thay đổi (nếu có)" }
              },
              required: ["product_name_or_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "delete_product",
            description: "Xoá sản phẩm khỏi hệ thống (ngừng hoạt động)",
            parameters: {
              type: "object",
              properties: {
                product_name_or_id: { type: "string", description: "Tên sản phẩm hoặc ID sản phẩm cần xoá" }
              },
              required: ["product_name_or_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_customer",
            description: "Thêm khách hàng mới vào cơ sở dữ liệu ZPOS",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Tên của khách hàng" },
                phone: { type: "string", description: "Số điện thoại liên lạc" },
                points: { type: "number", description: "Điểm thưởng tích luỹ ban đầu (mặc định 0)" }
              },
              required: ["name"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "delete_customer",
            description: "Xoá tài khoản khách hàng khỏi hệ thống ZPOS",
            parameters: {
              type: "object",
              properties: {
                customer_name_or_id: { type: "string", description: "Tên, số điện thoại hoặc ID khách hàng cần xoá" }
              },
              required: ["customer_name_or_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_supplier",
            description: "Thêm nhà cung cấp mới vào hệ thống ZPOS",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Tên nhà cung cấp / Tên công ty" },
                contact_name: { type: "string", description: "Tên người đại diện liên hệ" },
                phone: { type: "string", description: "Số điện thoại nhà cung cấp" },
                address: { type: "string", description: "Địa chỉ văn phòng / kho của nhà cung cấp" }
              },
              required: ["name"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "delete_supplier",
            description: "Xoá nhà cung cấp khỏi hệ thống",
            parameters: {
              type: "object",
              properties: {
                supplier_name_or_id: { type: "string", description: "Tên hoặc ID nhà cung cấp cần xoá" }
              },
              required: ["supplier_name_or_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_expense",
            description: "Ghi nhận một khoản chi phí vận hành mới vào hệ thống ZPOS",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Tiêu đề của chi phí (ví dụ: Trả tiền nước, Mua giấy in bill)" },
                amount: { type: "number", description: "Số tiền chi phí (VND)" },
                category_name: { type: "string", description: "Tên danh mục chi phí (ví dụ: Điện nước, Lương, Mặt bằng)" },
                status: { type: "string", description: "Trạng thái thanh toán ('paid' hoặc 'pending')" }
              },
              required: ["title", "amount"]
            }
          }
        }
      ];

      // Formulate completion messages
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      // 1. Initial LLM Call
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
          messages: apiMessages,
          tools: tools,
          tool_choice: "auto",
          temperature: 0.5,
        })
      });

      const aiData = await response.json();
      const assistantMessage = aiData?.choices?.[0]?.message;

      // Check if LLM requested a Tool Call
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolMessages = [];
        const executedActions = [];

        for (const call of assistantMessage.tool_calls) {
          const { name, arguments: argsString } = call.function;
          const args = JSON.parse(argsString);
          let result;
          try {
            // Execute database modifications!
            result = await executeTool(name, args);
            executedActions.push({ 
              id: call.id,
              name, 
              args, 
              result, 
              success: true 
            });
          } catch (err: any) {
            result = { error: err.message };
            executedActions.push({ 
              id: call.id,
              name, 
              args, 
              error: err.message, 
              success: false 
            });
          }

          toolMessages.push({
            role: "tool",
            tool_call_id: call.id,
            name: name,
            content: JSON.stringify(result)
          });
        }

        // 2. Call LLM again with Tool Results to generate final reply
        const finalResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
            messages: [
              ...apiMessages,
              assistantMessage,
              ...toolMessages
            ],
            temperature: 0.5
          })
        });

        const finalData = await finalResponse.json();
        const finalReply = finalData?.choices?.[0]?.message?.content;
        
        const returnedReply = finalReply || "Tôi đã xử lý lệnh và cập nhật hệ thống thành công.";
        return NextResponse.json({ 
          content: returnedReply,
          reply: returnedReply,
          actions: executedActions 
        });
      }

      // No tool calls, return simple response
      const aiReply = assistantMessage?.content;
      if (aiReply) {
        return NextResponse.json({ 
          content: aiReply,
          reply: aiReply
        });
      }
    }

    // 3. Fallback logic if Groq key isn't set or fails
    let reply = "";
    
    // Quick regex parsing for offline/no-API fallback commands
    if (lowerMsg.startsWith("thêm sản phẩm")) {
      // Format: "Thêm sản phẩm [tên] giá [giá] tồn kho [số lượng]"
      const match = lastMessage.match(/thêm sản phẩm (.+?) giá (\d+.*?)(?:\s+tồn kho\s+(\d+))?$/i);
      if (match) {
        const name = match[1].trim();
        const price = parseInt(match[2].replace(/[.,\sđ]/g, ""));
        const stock = match[3] ? parseInt(match[3]) : 10;
        
        try {
          const res = await executeTool("create_product", { name, price, stock });
          const fallbackText = `### ZPOS AI Offline Mode 📡\n\n${res.message}`;
          return NextResponse.json({
            content: fallbackText,
            reply: fallbackText,
            actions: [{ name: "create_product", args: { name, price, stock }, result: res, success: true }]
          });
        } catch (e: any) {
          const failText = `❌ Thêm sản phẩm thất bại: ${e.message}`;
          return NextResponse.json({ 
            content: failText,
            reply: failText
          });
        }
      }
    }

    // Default Fallback outputs
    if (lowerMsg.includes("doanh thu") || lowerMsg.includes("bán hàng") || lowerMsg.includes("revenue")) {
      reply = `### 📊 Báo cáo & Phân tích Doanh thu ZPOS AI

Dựa trên dữ liệu thực tế tại hệ thống:
- **Tổng doanh thu đạt được:** \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rev.totalRevenue)}\`
- **Số đơn hàng thành công:** \`${rev.ordersCount} đơn hàng\`
- **Giá trị trung bình mỗi đơn (AOV):** \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rev.averageOrderValue)}\`

**💡 Khuyến nghị tối ưu doanh thu:**
1. **Thúc đẩy AOV:** Thiết lập thêm các chương trình khuyến mãi mua kèm sản phẩm phụ kiện để tận dụng sức mua hiện tại của khách hàng.
2. **Kích thích tần suất mua hàng:** Gửi tin nhắn SMS/Zalo chăm sóc nhóm khách hàng cũ để nhắc nhở quay lại mua sắm.`;
    } else if (lowerMsg.includes("lợi nhuận") || lowerMsg.includes("lời lỗ") || lowerMsg.includes("profit")) {
      reply = `### 💸 Phân tích Hiệu quả Lợi nhuận (P&L)

Phân tích cấu trúc lợi chính xác của cửa hàng:
- **Doanh thu thuần:** \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.revenue)}\`
- **Giá vốn hàng bán (COGS):** \`-${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.cogs)}\`
- **Chi phí vận hành:** \`-${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.expenses)}\`
- **Lợi nhuận ròng:** \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.netProfit)}\`
- **Biên lợi nhuận ròng (Net Margin):** \`${profit.profitMargin.toFixed(1)}%\`

**📈 Khuyến nghị từ AI:**
* **Kiểm soát giá vốn:** Biên lợi nhuận đang ở mức tốt. Tuy nhiên cần đàm phán thêm chiết khấu với các nhà cung cấp lớn để đẩy biên lợi nhuận cao hơn nữa.
* **Tối ưu chi phí:** Rà soát lại các khoản chi phí vận hành định kỳ như tiền điện, nước để cắt giảm hao phí.`;
    } else if (lowerMsg.includes("tồn kho") || lowerMsg.includes("sản phẩm") || lowerMsg.includes("inventory") || lowerMsg.includes("stock")) {
      const itemsText = lowStock.map((i) => `- **${i.name}**: Tồn kho hiện tại chỉ còn \`${i.stock}\` chiếc.`).join("\n");
      reply = `### 📦 Báo cáo Cảnh báo Tồn kho AI

Trạng thái tồn kho của cửa hàng:
- Có **${lowStock.length}** sản phẩm đang rơi vào ngưỡng sắp hết hàng (tồn kho < 5 chiếc).

${lowStock.length > 0 ? `**Danh sách cảnh báo hết hàng:**\n${itemsText}` : "✅ Rất tuyệt vời! Hiện tại không có sản phẩm nào rơi vào trạng thái cảnh báo thiếu hàng."}

**💡 Khuyến nghị nhập hàng:**
* Nên lên đơn nhập hàng nháp tự động từ mục **Nhập hàng** cho các sản phẩm thiếu hụt để tránh gián đoạn việc bán lẻ.`;
    } else if (lowerMsg.includes("chi phí") || lowerMsg.includes("expense")) {
      const catText = expenses.categories.map((c: any) => `- **${c.name}**: \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(c.amount)}\``).join("\n");
      reply = `### 🧾 Cấu trúc chi phí vận hành

Tổng chi phí vận hành đã chi trả: **${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(expenses.totalExpenses)}**

**Cơ cấu chi tiết:**
${catText || "*Chưa ghi nhận chi phí nào*"}

**💡 Đề xuất tối ưu:**
* Cân nhắc điều chỉnh các khoản chi có tỷ trọng lớn nhất để đảm bảo dòng tiền lành mạnh.`;
    } else {
      reply = `### Xin chào! Tôi là Trợ lý AI có tất cả các quyền truy cập dữ liệu của ZPOS 🚀

Tôi có thể giúp bạn phân tích dữ liệu cửa hàng theo thời gian thực hoặc THỰC HIỆN CÁC LỆNH trực tiếp:
1. **Thêm sản phẩm mới** ("thêm sản phẩm Bánh mì thịt giá 25000 tồn kho 30")
2. **Sửa sản phẩm** ("sửa giá sản phẩm bánh mì thành 27000" hoặc "sửa tồn kho thành 40")
3. **Xoá sản phẩm** ("xoá sản phẩm bánh mì")
4. **Thêm khách hàng** ("thêm khách hàng Nguyễn Văn A số điện thoại 0912345678")
5. **Thêm nhà cung cấp** ("thêm nhà cung cấp ViZ Solutions, ĐT 0987654321")
6. **Thêm chi phí** ("thêm chi phí tiền điện 1.200.000đ")

**📊 Tóm tắt nhanh chỉ số hiện tại:**
- Doanh thu: \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rev.totalRevenue)}\`
- Lợi nhuận ròng: \`${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(profit.netProfit)}\`
- Cảnh báo hết hàng: \`${lowStock.length} sản phẩm\``;
    }

    return NextResponse.json({ 
      content: reply,
      reply: reply
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
