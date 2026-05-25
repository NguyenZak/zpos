"use server";

import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function submitProductReview(formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const authorName = formData.get("authorName") as string;
    const content = formData.get("content") as string;
    const rating = parseInt(formData.get("rating") as string, 10);
    const tenantId = formData.get("tenantId") as string;

    if (!productId || !authorName || !content || !rating || !tenantId) {
      return { error: "Vui lòng điền đầy đủ thông tin" };
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        organization_id: tenantId,
        author_name: authorName,
        content: content,
        rating: rating,
        status: "published"
      });

    if (error) {
      console.error("Supabase insert error:", error);
      return { error: "Lỗi kết nối CSDL: " + error.message };
    }

    // Revalidate the product page to show the new review
    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Action error:", err);
    return { error: "Đã xảy ra lỗi hệ thống" };
  }
}
