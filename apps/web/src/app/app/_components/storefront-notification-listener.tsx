"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { telegramService } from "@/services/telegram.service";
import { posService } from "@/services/pos.service";

export function StorefrontNotificationListener() {
  const supabase = createClient();

  useEffect(() => {
    let channel: any;

    async function setupListener() {
      try {
        const branches = await posService.getBranches();
        if (!branches || branches.length === 0) return;
        const orgId = branches[0].organization_id;

        channel = supabase
          .channel(`tenant:${orgId}:orders`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "orders",
              filter: `organization_id=eq.${orgId}`,
            },
            (payload) => {
              const newOrder = payload.new;
              if (newOrder.source === "online") {
                // Play sound effect
                try {
                  const audio = new Audio("/sounds/notification.mp3");
                  audio.play().catch((e) => console.warn("Could not play sound", e));
                } catch (e) {}

                toast.success("🛒 Có đơn hàng Online mới!", {
                  description: `Mã đơn: ${newOrder.order_number} - ${new Intl.NumberFormat("vi-VN").format(newOrder.total_amount)}đ`,
                  duration: 10000,
                });

                // Fetch order items to send complete telegram message
                supabase
                  .from("order_items")
                  .select("quantity, unit_price, product_variants(products(name))")
                  .eq("order_id", newOrder.id)
                  .then(({ data: itemsData }) => {
                    const items =
                      itemsData?.map((i: any) => ({
                        name: i.product_variants?.products?.name || "Sản phẩm",
                        quantity: i.quantity,
                        price: i.unit_price,
                      })) || [];

                    telegramService.notifyNewOrder(
                      newOrder,
                      items,
                      "Storefront (Web)",
                      newOrder.customer_id ? "Thành viên" : "Khách lẻ",
                    );
                  });
              }
            },
          )
          .subscribe();
      } catch (e) {
        console.warn("Failed to setup Storefront Notification Listener", e);
      }
    }

    setupListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  return null;
}
