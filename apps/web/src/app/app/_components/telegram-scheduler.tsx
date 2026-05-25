"use client";

import React, { useEffect } from "react";
import { posService } from "@/services/pos.service";
import { telegramService } from "@/services/telegram.service";
export function TelegramScheduler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkReports = async () => {
      // Check if Telegram is enabled first
      const enabled = localStorage.getItem("zpos_telegram_enabled") === "true";
      const reportsEnabled = localStorage.getItem("zpos_telegram_notify_reports") !== "false";
      const staleProductsEnabled = localStorage.getItem("zpos_telegram_notify_stale_products") !== "false";
      if (!enabled) return;

      try {
        const orders = await posService.getOrders();

        if (reportsEnabled && orders && orders.length > 0) {
          // 1. Run Daily report check
          await checkAndSendDailyReport(orders);

          // 2. Run Weekly report check
          await checkAndSendWeeklyReport(orders);

          // 3. Run Monthly report check
          await checkAndSendMonthlyReport(orders);
        }

        if (staleProductsEnabled) {
          const products = await posService.getProducts();
          await checkAndSendStaleProducts(products || [], orders || []);
        }
      } catch (e) {
        console.warn("[TelegramScheduler] Failed checking scheduled reports:", e);
      }
    };

    // Helper function to format date
    const formatDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const formatVND = (value: number) => {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    const checkAndSendDailyReport = async (orders: any[]) => {
      const now = new Date();
      const todayStr = formatDateString(now);

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = formatDateString(yesterday);

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // 1. Send today's report if it's 23:50+ and not sent
      if (currentHour === 23 && currentMinute >= 50) {
        const alreadySentToday = localStorage.getItem(`zpos_tel_daily_${todayStr}`) === "true";
        if (!alreadySentToday) {
          await sendDailyReportForDate(todayStr, orders);
          localStorage.setItem(`zpos_tel_daily_${todayStr}`, "true");
          return;
        }
      }

      // 2. Send yesterday's report if it was missed
      const alreadySentYesterday = localStorage.getItem(`zpos_tel_daily_${yesterdayStr}`) === "true";
      if (!alreadySentYesterday) {
        await sendDailyReportForDate(yesterdayStr, orders);
        localStorage.setItem(`zpos_tel_daily_${yesterdayStr}`, "true");
      }
    };

    const sendDailyReportForDate = async (dateStr: string, orders: any[]) => {
      const targetOrders = orders.filter((o) => {
        const oDate = new Date(o.created_at);
        const y = oDate.getFullYear();
        const m = String(oDate.getMonth() + 1).padStart(2, "0");
        const d = String(oDate.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}` === dateStr;
      });

      const totalRevenue = targetOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = targetOrders.length;
      const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      let cashRev = 0;
      let cashCount = 0;
      let qrRev = 0;
      let qrCount = 0;

      targetOrders.forEach((o) => {
        if (o.payment_method === "cash") {
          cashRev += o.total_amount || 0;
          cashCount++;
        } else {
          qrRev += o.total_amount || 0;
          qrCount++;
        }
      });

      const productSalesMap = new Map<string, number>();
      targetOrders.forEach((o) => {
        (o.order_items || []).forEach((item: any) => {
          const name = item.product_name || "Sản phẩm khác";
          const qty = item.quantity || 1;
          productSalesMap.set(name, (productSalesMap.get(name) || 0) + qty);
        });
      });

      const sortedProducts = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let productListStr = "";
      sortedProducts.forEach(([name, qty], idx) => {
        productListStr += `${idx + 1}. <b>${name}</b> - <code>${qty}</code> món\n`;
      });
      if (sortedProducts.length === 0) {
        productListStr = "<i>(Chưa có sản phẩm nào được bán)</i>\n";
      }

      const parts = dateStr.split("-");
      const displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

      const message =
        `📊 <b>BÁO CÁO DOANH THU CUỐI NGÀY</b>\n` +
        `📅 Ngày báo cáo: <b>${displayDate}</b>\n\n` +
        `💰 <b>Tổng doanh thu:</b> <code>${formatVND(totalRevenue)}</code>\n` +
        `📦 <b>Số lượng đơn hàng:</b> <b>${totalOrders} đơn</b>\n` +
        `💳 <b>Trung bình/đơn:</b> <code>${formatVND(avgOrder)}</code>\n\n` +
        `💵 <b>Tiền mặt:</b> ${formatVND(cashRev)} (${cashCount} đơn)\n` +
        `💳 <b>Chuyển khoản:</b> ${formatVND(qrRev)} (${qrCount} đơn)\n\n` +
        `🏆 <b>Top sản phẩm bán chạy:</b>\n${productListStr}\n` +
        `⚡️ <i>Hệ thống ZPOS tự động gửi báo cáo cuối ngày.</i>`;

      await telegramService.sendMessage(message, "reports");
    };

    const checkAndSendWeeklyReport = async (orders: any[]) => {
      const now = new Date();
      const currentDay = now.getDay();
      const lastSunday = new Date(now);

      if (currentDay === 0) {
        // Sunday
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        if (currentHour === 23 && currentMinute >= 50) {
          const sundayStr = formatDateString(now);
          const alreadySent = localStorage.getItem(`zpos_tel_weekly_${sundayStr}`) === "true";
          if (!alreadySent) {
            await sendWeeklyReportForSunday(now, orders);
            localStorage.setItem(`zpos_tel_weekly_${sundayStr}`, "true");
          }
        }
      } else {
        // Another day - check if last Sunday was sent
        lastSunday.setDate(now.getDate() - currentDay);
        const lastSundayStr = formatDateString(lastSunday);
        const alreadySent = localStorage.getItem(`zpos_tel_weekly_${lastSundayStr}`) === "true";
        if (!alreadySent) {
          await sendWeeklyReportForSunday(lastSunday, orders);
          localStorage.setItem(`zpos_tel_weekly_${lastSundayStr}`, "true");
        }
      }
    };

    const sendWeeklyReportForSunday = async (sundayDate: Date, orders: any[]) => {
      const mondayDate = new Date(sundayDate);
      mondayDate.setDate(sundayDate.getDate() - 6);

      const startOfWeek = new Date(mondayDate);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(sundayDate);
      endOfWeek.setHours(23, 59, 59, 999);

      const targetOrders = orders.filter((o) => {
        const oDate = new Date(o.created_at);
        return oDate >= startOfWeek && oDate <= endOfWeek;
      });

      const totalRevenue = targetOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = targetOrders.length;
      const dailyAvg = Math.round(totalRevenue / 7);

      const productSalesMap = new Map<string, number>();
      targetOrders.forEach((o) => {
        (o.order_items || []).forEach((item: any) => {
          const name = item.product_name || "Sản phẩm khác";
          const qty = item.quantity || 1;
          productSalesMap.set(name, (productSalesMap.get(name) || 0) + qty);
        });
      });

      const sortedProducts = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let productListStr = "";
      sortedProducts.forEach(([name, qty], idx) => {
        productListStr += `${idx + 1}. <b>${name}</b> - <code>${qty}</code> món\n`;
      });
      if (sortedProducts.length === 0) {
        productListStr = "<i>(Chưa có sản phẩm nào được bán)</i>\n";
      }

      const rangeStr = `${mondayDate.getDate()}/${mondayDate.getMonth() + 1} - ${sundayDate.getDate()}/${sundayDate.getMonth() + 1}/${sundayDate.getFullYear()}`;

      const message =
        `📈 <b>BÁO CÁO DOANH THU TUẦN</b>\n` +
        `📅 Chu kỳ: <b>${rangeStr}</b>\n\n` +
        `💰 <b>Tổng doanh thu tuần:</b> <code>${formatVND(totalRevenue)}</code>\n` +
        `📦 <b>Tổng số đơn hàng:</b> <b>${totalOrders} đơn</b>\n` +
        `📊 <b>Doanh thu trung bình/ngày:</b> <code>${formatVND(dailyAvg)}</code>\n\n` +
        `🏆 <b>Top 5 sản phẩm bán chạy nhất tuần:</b>\n${productListStr}\n` +
        `⚡️ <i>Hệ thống ZPOS tự động gửi báo cáo tuần vào tối Chủ Nhật.</i>`;

      await telegramService.sendMessage(message, "reports");
    };

    const checkAndSendMonthlyReport = async (orders: any[]) => {
      const now = new Date();

      const formatMonthString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      };

      const currentMonthStr = formatMonthString(now);

      const lastMonthDate = new Date(now);
      lastMonthDate.setDate(1);
      lastMonthDate.setMonth(now.getMonth() - 1);
      const lastMonthStr = formatMonthString(lastMonthDate);

      const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const isLastDay = now.getDate() === lastDayOfCurrentMonth;

      if (isLastDay) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        if (currentHour === 23 && currentMinute >= 50) {
          const alreadySent = localStorage.getItem(`zpos_tel_monthly_${currentMonthStr}`) === "true";
          if (!alreadySent) {
            await sendMonthlyReportForMonth(now, orders);
            localStorage.setItem(`zpos_tel_monthly_${currentMonthStr}`, "true");
          }
        }
      } else {
        const alreadySentLastMonth = localStorage.getItem(`zpos_tel_monthly_${lastMonthStr}`) === "true";
        if (!alreadySentLastMonth) {
          await sendMonthlyReportForMonth(lastMonthDate, orders);
          localStorage.setItem(`zpos_tel_monthly_${lastMonthStr}`, "true");
        }
      }
    };

    const sendMonthlyReportForMonth = async (monthDate: Date, orders: any[]) => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endOfMonth = new Date(year, month, lastDay, 23, 59, 59, 999);

      const targetOrders = orders.filter((o) => {
        const oDate = new Date(o.created_at);
        return oDate >= startOfMonth && oDate <= endOfMonth;
      });

      const totalRevenue = targetOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = targetOrders.length;
      const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      let cashRev = 0;
      let qrRev = 0;
      targetOrders.forEach((o) => {
        if (o.payment_method === "cash") {
          cashRev += o.total_amount || 0;
        } else {
          qrRev += o.total_amount || 0;
        }
      });

      const productSalesMap = new Map<string, number>();
      targetOrders.forEach((o) => {
        (o.order_items || []).forEach((item: any) => {
          const name = item.product_name || "Sản phẩm khác";
          const qty = item.quantity || 1;
          productSalesMap.set(name, (productSalesMap.get(name) || 0) + qty);
        });
      });

      const sortedProducts = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let productListStr = "";
      sortedProducts.forEach(([name, qty], idx) => {
        productListStr += `${idx + 1}. <b>${name}</b> - <code>${qty}</code> món\n`;
      });
      if (sortedProducts.length === 0) {
        productListStr = "<i>(Chưa có sản phẩm nào được bán)</i>\n";
      }

      const displayMonth = `${String(month + 1).padStart(2, "0")}/${year}`;

      const message =
        `🗓 <b>BÁO CÁO DOANH THU THÁNG</b>\n` +
        `📅 Chu kỳ: <b>Tháng ${displayMonth}</b>\n\n` +
        `💰 <b>Tổng doanh thu tháng:</b> <code>${formatVND(totalRevenue)}</code>\n` +
        `📦 <b>Tổng số đơn hàng:</b> <b>${totalOrders} đơn</b>\n` +
        `💳 <b>Trung bình/đơn:</b> <code>${formatVND(avgOrder)}</code>\n\n` +
        `💵 <b>Tiền mặt:</b> ${formatVND(cashRev)}\n` +
        `💳 <b>Chuyển khoản:</b> ${formatVND(qrRev)}\n\n` +
        `🏆 <b>Top 5 sản phẩm bán chạy nhất tháng:</b>\n${productListStr}\n` +
        `⚡️ <i>Hệ thống ZPOS tự động gửi báo cáo tháng vào tối ngày cuối tháng.</i>`;

      await telegramService.sendMessage(message, "reports");
    };

    const checkAndSendStaleProducts = async (products: any[], orders: any[]) => {
      const days = Math.max(1, parseInt(localStorage.getItem("zpos_telegram_stale_product_days") || "7", 10));
      const todayStr = formatDateString(new Date());
      const alreadySentToday = localStorage.getItem(`zpos_tel_stale_products_${days}_${todayStr}`) === "true";
      if (alreadySentToday) return;

      const now = Date.now();
      const thresholdMs = days * 24 * 60 * 60 * 1000;
      const lastSoldByKey = new Map<string, Date>();

      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        if (Number.isNaN(orderDate.getTime())) return;

        (order.order_items || []).forEach((item: any) => {
          const keys = [item.variant_id, item.product_id].filter(Boolean);
          keys.forEach((key) => {
            const current = lastSoldByKey.get(key);
            if (!current || orderDate > current) {
              lastSoldByKey.set(key, orderDate);
            }
          });
        });
      });

      const staleItems: Array<{ name: string; stock: number; daysWithoutSale: number; lastSoldLabel: string }> = [];

      products.forEach((product: any) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const productLastSold = lastSoldByKey.get(product.id);

        if (variants.length > 0) {
          variants.forEach((variant: any) => {
            const stock = Number(variant.stock || 0);
            if (stock <= 0) return;

            const lastSold = lastSoldByKey.get(variant.id) || productLastSold;
            const daysWithoutSale = lastSold ? Math.floor((now - lastSold.getTime()) / (24 * 60 * 60 * 1000)) : days;
            if (lastSold && now - lastSold.getTime() < thresholdMs) return;

            staleItems.push({
              name: `${product.name} - ${variant.name}`,
              stock,
              daysWithoutSale,
              lastSoldLabel: lastSold ? `lần bán cuối ${lastSold.toLocaleDateString("vi-VN")}` : "chưa từng bán",
            });
          });
          return;
        }

        const stock = Number(product.stock || 0);
        if (stock <= 0) return;

        const daysWithoutSale = productLastSold
          ? Math.floor((now - productLastSold.getTime()) / (24 * 60 * 60 * 1000))
          : days;
        if (productLastSold && now - productLastSold.getTime() < thresholdMs) return;

        staleItems.push({
          name: product.name,
          stock,
          daysWithoutSale,
          lastSoldLabel: productLastSold
            ? `lần bán cuối ${productLastSold.toLocaleDateString("vi-VN")}`
            : "chưa từng bán",
        });
      });

      staleItems.sort((a, b) => b.daysWithoutSale - a.daysWithoutSale || b.stock - a.stock);
      await telegramService.notifyStaleProducts(staleItems, days);
      if (staleItems.length > 0) {
        localStorage.setItem(`zpos_tel_stale_products_${days}_${todayStr}`, "true");
      }
    };

    // Run initially
    checkReports();

    // Then check every 5 minutes in background
    const interval = setInterval(checkReports, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
