import { createClient } from "@/utils/supabase/client";
import { permissionService } from "./permission.service";

export interface LoyaltyProgram {
  id: string;
  organization_id: string;
  is_enabled: boolean;
  point_name: string;
  expiration_months: number;
  birthday_bonus_points: number;
  first_purchase_bonus_points: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyTier {
  id: string;
  organization_id: string;
  name: string;
  min_points: number;
  points_multiplier: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyRule {
  id: string;
  organization_id: string;
  name: string;
  rule_type: "earning_spend" | "earning_order" | "earning_product" | "redemption_discount";
  product_id?: string | null;
  category_id?: string | null;
  spend_amount?: number | null;
  points_awarded?: number | null;
  points_required?: number | null;
  discount_amount?: number | null;
  min_points_to_redeem?: number;
  max_discount_percentage?: number;
  allow_on_discounted_orders?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyCampaign {
  id: string;
  organization_id: string;
  name: string;
  campaign_type: "double_points" | "first_purchase" | "birthday_bonus" | "custom";
  points_multiplier: number;
  bonus_points: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyTransaction {
  id: string;
  organization_id: string;
  customer_id: string;
  order_id?: string | null;
  transaction_type: "earn" | "redeem" | "adjust_add" | "adjust_sub" | "expire";
  points: number;
  amount_spent: number;
  notes?: string | null;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  };
}

export interface CustomerLoyaltyBalance {
  id: string;
  organization_id: string;
  customer_id: string;
  current_points: number;
  lifetime_points: number;
  tier_id?: string | null;
  updated_at: string;
  tier?: LoyaltyTier | null;
}

const STORAGE_PREFIX = "zpos_loyalty_";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

export const loyaltyService = {
  // Helper to check for missing table error
  isTableMissing(error: any): boolean {
    return permissionService.isTableMissingError(error);
  },

  // ----------------------------------------------------
  // LOYALTY PROGRAM SETTINGS
  // ----------------------------------------------------
  async getProgram(): Promise<LoyaltyProgram> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      const { data, error } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (error) {
        if (this.isTableMissing(error)) return this.getLocalProgram(orgId);
        throw error;
      }

      if (!data) {
        // Automatically create default program setting
        return await this.createDefaultProgram(orgId);
      }

      return data;
    } catch (e) {
      console.warn("Supabase getProgram error, returning local:", e);
      return this.getLocalProgram(orgId);
    }
  },

  async updateProgram(payload: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền cập nhật cấu hình tích điểm.");

    try {
      const current = await this.getProgram();
      const { data, error } = await supabase
        .from("loyalty_programs")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .select()
        .single();

      if (error) {
        if (this.isTableMissing(error)) return this.updateLocalProgram(orgId, payload);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.program_update", payload);
      return data;
    } catch (e) {
      const updated = this.updateLocalProgram(orgId, payload);
      await permissionService.createAuditLog(orgId, userId, "loyalty.program_update", payload);
      return updated;
    }
  },

  // ----------------------------------------------------
  // LOYALTY TIERS
  // ----------------------------------------------------
  async getTiers(): Promise<LoyaltyTier[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .eq("organization_id", orgId)
        .order("min_points", { ascending: true });

      if (error) {
        if (this.isTableMissing(error)) return this.getLocalTiers(orgId);
        throw error;
      }

      if (!data || data.length === 0) {
        return await this.seedDefaultTiers(orgId);
      }

      return data;
    } catch (e) {
      return this.getLocalTiers(orgId);
    }
  },

  async createTier(
    payload: Omit<LoyaltyTier, "id" | "organization_id" | "created_at" | "updated_at">,
  ): Promise<LoyaltyTier> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền cập nhật cấu hình hạng thành viên.");

    const row = {
      ...payload,
      organization_id: orgId,
    };

    try {
      const { data, error } = await supabase.from("loyalty_tiers").insert([row]).select().single();

      if (error) {
        if (this.isTableMissing(error)) return this.createLocalTier(orgId, row);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_create", { name: payload.name });
      return data;
    } catch (e) {
      const tier = this.createLocalTier(orgId, row);
      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_create", { name: payload.name });
      return tier;
    }
  },

  async updateTier(id: string, payload: Partial<LoyaltyTier>): Promise<LoyaltyTier> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền cập nhật cấu hình hạng thành viên.");

    try {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (this.isTableMissing(error)) return this.updateLocalTier(orgId, id, payload);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_update", { id, ...payload });
      return data;
    } catch (e) {
      const tier = this.updateLocalTier(orgId, id, payload);
      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_update", { id, ...payload });
      return tier;
    }
  },

  async deleteTier(id: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền xóa hạng thành viên.");

    try {
      const { error } = await supabase.from("loyalty_tiers").delete().eq("id", id);
      if (error) {
        if (this.isTableMissing(error)) return this.deleteLocalTier(orgId, id);
        throw error;
      }
      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_delete", { id });
      return true;
    } catch (e) {
      this.deleteLocalTier(orgId, id);
      await permissionService.createAuditLog(orgId, userId, "loyalty.tier_delete", { id });
      return true;
    }
  },

  // ----------------------------------------------------
  // LOYALTY RULES
  // ----------------------------------------------------
  async getRules(): Promise<LoyaltyRule[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      const { data, error } = await supabase.from("loyalty_rules").select("*").eq("organization_id", orgId);

      if (error) {
        if (this.isTableMissing(error)) return this.getLocalRules(orgId);
        throw error;
      }

      if (!data || data.length === 0) {
        return await this.seedDefaultRules(orgId);
      }

      return data;
    } catch (e) {
      return this.getLocalRules(orgId);
    }
  },

  async createRule(
    payload: Omit<LoyaltyRule, "id" | "organization_id" | "created_at" | "updated_at">,
  ): Promise<LoyaltyRule> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền thiết lập quy tắc tích/đổi điểm.");

    const row = {
      ...payload,
      organization_id: orgId,
    };

    try {
      const { data, error } = await supabase.from("loyalty_rules").insert([row]).select().single();

      if (error) {
        if (this.isTableMissing(error)) return this.createLocalRule(orgId, row);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_create", { name: payload.name });
      return data;
    } catch (e) {
      const rule = this.createLocalRule(orgId, row);
      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_create", { name: payload.name });
      return rule;
    }
  },

  async updateRule(id: string, payload: Partial<LoyaltyRule>): Promise<LoyaltyRule> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền cập nhật quy tắc tích/đổi điểm.");

    try {
      const { data, error } = await supabase
        .from("loyalty_rules")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (this.isTableMissing(error)) return this.updateLocalRule(orgId, id, payload);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_update", { id, ...payload });
      return data;
    } catch (e) {
      const rule = this.updateLocalRule(orgId, id, payload);
      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_update", { id, ...payload });
      return rule;
    }
  },

  async deleteRule(id: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền xóa quy tắc.");

    try {
      const { error } = await supabase.from("loyalty_rules").delete().eq("id", id);
      if (error) {
        if (this.isTableMissing(error)) return this.deleteLocalRule(orgId, id);
        throw error;
      }
      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_delete", { id });
      return true;
    } catch (e) {
      this.deleteLocalRule(orgId, id);
      await permissionService.createAuditLog(orgId, userId, "loyalty.rule_delete", { id });
      return true;
    }
  },

  // ----------------------------------------------------
  // LOYALTY CAMPAIGNS
  // ----------------------------------------------------
  async getCampaigns(): Promise<LoyaltyCampaign[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      const { data, error } = await supabase.from("loyalty_campaigns").select("*").eq("organization_id", orgId);

      if (error) {
        if (this.isTableMissing(error)) return this.getLocalCampaigns(orgId);
        throw error;
      }

      return data || [];
    } catch (e) {
      return this.getLocalCampaigns(orgId);
    }
  },

  async createCampaign(
    payload: Omit<LoyaltyCampaign, "id" | "organization_id" | "created_at" | "updated_at">,
  ): Promise<LoyaltyCampaign> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền thiết lập chiến dịch tích điểm.");

    const row = {
      ...payload,
      organization_id: orgId,
    };

    try {
      const { data, error } = await supabase.from("loyalty_campaigns").insert([row]).select().single();

      if (error) {
        if (this.isTableMissing(error)) return this.createLocalCampaign(orgId, row);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_create", { name: payload.name });
      return data;
    } catch (e) {
      const campaign = this.createLocalCampaign(orgId, row);
      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_create", { name: payload.name });
      return campaign;
    }
  },

  async updateCampaign(id: string, payload: Partial<LoyaltyCampaign>): Promise<LoyaltyCampaign> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền cập nhật chiến dịch.");

    try {
      const { data, error } = await supabase
        .from("loyalty_campaigns")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (this.isTableMissing(error)) return this.updateLocalCampaign(orgId, id, payload);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_update", { id, ...payload });
      return data;
    } catch (e) {
      const campaign = this.updateLocalCampaign(orgId, id, payload);
      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_update", { id, ...payload });
      return campaign;
    }
  },

  async deleteCampaign(id: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canUpdate = await permissionService.hasPermission("loyalty.configure");
    if (!canUpdate) throw new Error("Bạn không có quyền xóa chiến dịch.");

    try {
      const { error } = await supabase.from("loyalty_campaigns").delete().eq("id", id);
      if (error) {
        if (this.isTableMissing(error)) return this.deleteLocalCampaign(orgId, id);
        throw error;
      }
      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_delete", { id });
      return true;
    } catch (e) {
      this.deleteLocalCampaign(orgId, id);
      await permissionService.createAuditLog(orgId, userId, "loyalty.campaign_delete", { id });
      return true;
    }
  },

  // ----------------------------------------------------
  // CUSTOMER LOYALTY BALANCE & TRANSACTIONS
  // ----------------------------------------------------
  async getCustomerBalance(customerId: string): Promise<CustomerLoyaltyBalance> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      const { data, error } = await supabase
        .from("customer_loyalty_balances")
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .eq("customer_id", customerId)
        .maybeSingle();

      if (error) {
        if (this.isTableMissing(error)) return this.getLocalCustomerBalance(orgId, customerId);
        throw error;
      }

      if (!data) {
        return this.createEmptyCustomerBalance(orgId, customerId);
      }

      return data;
    } catch (e) {
      return this.getLocalCustomerBalance(orgId, customerId);
    }
  },

  async getTransactions(customerId?: string): Promise<LoyaltyTransaction[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    try {
      let query = supabase
        .from("loyalty_transactions")
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;
      if (error) {
        if (this.isTableMissing(error)) return this.getLocalTransactions(orgId, customerId);
        throw error;
      }

      return data || [];
    } catch (e) {
      return this.getLocalTransactions(orgId, customerId);
    }
  },

  async adjustPoints(customerId: string, points: number, notes: string): Promise<LoyaltyTransaction> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canAdjust = await permissionService.hasPermission("loyalty.adjust");
    if (!canAdjust) throw new Error("Bạn không có quyền điều chỉnh điểm tích lũy thủ công.");

    const row = {
      organization_id: orgId,
      customer_id: customerId,
      transaction_type: points >= 0 ? "adjust_add" : ("adjust_sub" as any),
      points: points,
      amount_spent: 0,
      notes: notes,
    };

    try {
      const { data, error } = await supabase.from("loyalty_transactions").insert([row]).select().single();

      if (error) {
        if (this.isTableMissing(error)) return this.createLocalTransaction(orgId, row);
        throw error;
      }

      await permissionService.createAuditLog(orgId, userId, "loyalty.adjust_points", {
        customer_id: customerId,
        points,
        notes,
      });
      return data;
    } catch (e) {
      const tx = this.createLocalTransaction(orgId, row);
      await permissionService.createAuditLog(orgId, userId, "loyalty.adjust_points", {
        customer_id: customerId,
        points,
        notes,
      });
      return tx;
    }
  },

  // ----------------------------------------------------
  // POS INTEGRATIONS AND CALCULATIONS
  // ----------------------------------------------------
  async calculateEarnedPoints(
    customerId: string | null,
    amountSpent: number,
    items: any[],
  ): Promise<{ points: number; breakDown: string }> {
    const program = await this.getProgram();
    if (!program || !program.is_enabled) {
      return { points: 0, breakDown: "Chương trình tích điểm chưa kích hoạt" };
    }

    const rules = await this.getRules();
    const activeRules = rules.filter((r) => r.is_active);
    const campaigns = await this.getCampaigns();
    const activeCampaigns = campaigns.filter(
      (c) =>
        c.is_active &&
        (!c.start_date || new Date(c.start_date) <= new Date()) &&
        (!c.end_date || new Date(c.end_date) >= new Date()),
    );

    let earned = 0;
    let explanation = "";

    // 1. Earning Rules Evaluation
    // Rule: Spend X amount -> Y points
    const spendRule = activeRules.find((r) => r.rule_type === "earning_spend");
    if (spendRule && spendRule.spend_amount && spendRule.points_awarded) {
      const pointsFromSpend = Math.floor(amountSpent / Number(spendRule.spend_amount)) * spendRule.points_awarded;
      if (pointsFromSpend > 0) {
        earned += pointsFromSpend;
        explanation += `+${pointsFromSpend} điểm (Chi tiêu ${spendRule.spend_amount.toLocaleString()}đ nhận ${spendRule.points_awarded} điểm) `;
      }
    }

    // Rule: Every order -> X points
    const orderRule = activeRules.find((r) => r.rule_type === "earning_order");
    if (orderRule && orderRule.points_awarded) {
      earned += orderRule.points_awarded;
      explanation += `+${orderRule.points_awarded} điểm (Thưởng hóa đơn) `;
    }

    // Rule: Specific product / category extra points
    items.forEach((item) => {
      const prodRule = activeRules.find((r) => r.rule_type === "earning_product" && r.product_id === item.id);
      if (prodRule && prodRule.points_awarded) {
        const prodPoints = prodRule.points_awarded * (item.quantity || 1);
        earned += prodPoints;
        explanation += `+${prodPoints} điểm (Thưởng sản phẩm ${item.name}) `;
      }
    });

    // 2. VIP Tier Multiplier
    let multiplier = 1.0;
    if (customerId) {
      const balance = await this.getCustomerBalance(customerId);
      if (balance?.tier?.points_multiplier) {
        multiplier = Number(balance.tier.points_multiplier);
        if (multiplier > 1.0) {
          explanation += `x${multiplier} (Hạng ${balance.tier.name}) `;
        }
      }
    }

    // 3. Campaign Multiplier (Double Points)
    const doublePointsCamp = activeCampaigns.find((c) => c.campaign_type === "double_points");
    if (doublePointsCamp) {
      multiplier *= Number(doublePointsCamp.points_multiplier || 2.0);
      explanation += `x${doublePointsCamp.points_multiplier || 2} (Sự kiện: ${doublePointsCamp.name}) `;
    }

    let finalPoints = Math.floor(earned * multiplier);

    // 4. Birthday & First Purchase campaigns
    if (customerId) {
      const balance = await this.getCustomerBalance(customerId);
      const isFirstPurchase = balance.lifetime_points === 0;

      const firstPurchaseCamp = activeCampaigns.find((c) => c.campaign_type === "first_purchase");
      if (isFirstPurchase && firstPurchaseCamp) {
        finalPoints += firstPurchaseCamp.bonus_points;
        explanation += `+${firstPurchaseCamp.bonus_points} điểm (Mua hàng lần đầu: ${firstPurchaseCamp.name}) `;
      } else if (isFirstPurchase && program.first_purchase_bonus_points > 0) {
        finalPoints += program.first_purchase_bonus_points;
        explanation += `+${program.first_purchase_bonus_points} điểm (Thưởng mua hàng lần đầu) `;
      }
    }

    return {
      points: finalPoints,
      breakDown: explanation.trim() || `Tích ${finalPoints} điểm`,
    };
  },

  async calculateRedeemablePoints(
    customerId: string,
    orderAmount: number,
    isDiscountedOrder: boolean,
  ): Promise<{ maxRedeemablePoints: number; discountAmount: number; minPointsToRedeem: number }> {
    const program = await this.getProgram();
    if (!program || !program.is_enabled) {
      return { maxRedeemablePoints: 0, discountAmount: 0, minPointsToRedeem: 0 };
    }

    const rules = await this.getRules();
    const redemptionRule = rules.find((r) => r.rule_type === "redemption_discount" && r.is_active);
    if (!redemptionRule || !redemptionRule.points_required || !redemptionRule.discount_amount) {
      return { maxRedeemablePoints: 0, discountAmount: 0, minPointsToRedeem: 0 };
    }

    if (isDiscountedOrder && !redemptionRule.allow_on_discounted_orders) {
      return { maxRedeemablePoints: 0, discountAmount: 0, minPointsToRedeem: 0 };
    }

    const balance = await this.getCustomerBalance(customerId);
    const availablePoints = balance.current_points;

    const minPoints = redemptionRule.min_points_to_redeem || 0;
    if (availablePoints < minPoints) {
      return { maxRedeemablePoints: 0, discountAmount: 0, minPointsToRedeem: minPoints };
    }

    // 1 point discount equivalence: e.g. 100 points = 10,000 VND -> 1 point = 100 VND
    const valuePerPoint = Number(redemptionRule.discount_amount) / redemptionRule.points_required;

    // Max discount cap: e.g. 30% of orderAmount
    const maxDiscountPercentage = Number(redemptionRule.max_discount_percentage || 100);
    const maxDiscountVal = (orderAmount * maxDiscountPercentage) / 100;

    // Points required for max discount value
    const maxPointsForCap = Math.floor(maxDiscountVal / valuePerPoint);

    // Final points that can be redeemed
    const maxPointsToRedeem = Math.min(availablePoints, maxPointsForCap);
    const discountAmount = Math.floor(maxPointsToRedeem * valuePerPoint);

    return {
      maxRedeemablePoints: maxPointsToRedeem,
      discountAmount: discountAmount,
      minPointsToRedeem: minPoints,
    };
  },

  async applyRedemption(
    customerId: string,
    orderId: string,
    pointsRedeemed: number,
    discountApplied: number,
  ): Promise<void> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    const rowTx = {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      transaction_type: "redeem" as const,
      points: -pointsRedeemed,
      amount_spent: 0,
      notes: `Đổi điểm thanh toán đơn hàng #${orderId.slice(0, 8)}`,
    };

    const rowRedeem = {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      points_redeemed: pointsRedeemed,
      discount_applied: discountApplied,
    };

    try {
      const { data, error: txErr } = await supabase.from("loyalty_transactions").insert([rowTx]).select().single();
      if (txErr) {
        console.error(
          "[Loyalty] applyRedemption INSERT failed:",
          JSON.stringify(txErr, Object.getOwnPropertyNames(txErr)),
        );
        if (this.isTableMissing(txErr)) {
          this.applyLocalRedemption(orgId, customerId, orderId, pointsRedeemed, discountApplied);
          return;
        }
        if (txErr.code === "42501") {
          console.warn(
            "[Loyalty] RLS blocked applyRedemption — run loyalty_fix_v2.sql in Supabase Dashboard. Falling back to localStorage.",
          );
          this.applyLocalRedemption(orgId, customerId, orderId, pointsRedeemed, discountApplied);
          return;
        }
        throw txErr;
      }
      await supabase.from("loyalty_redemptions").insert([rowRedeem]);
      console.info(
        "[Loyalty] ✅ Redeemed",
        pointsRedeemed,
        "points for customer",
        customerId,
        "order",
        orderId.slice(0, 8),
      );
    } catch (e) {
      console.error("[Loyalty] applyRedemption exception:", e);
      this.applyLocalRedemption(orgId, customerId, orderId, pointsRedeemed, discountApplied);
    }
  },

  async applyEarning(customerId: string, orderId: string, pointsEarned: number, amountSpent: number): Promise<void> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    if (pointsEarned <= 0) return;

    const rowTx = {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      transaction_type: "earn" as const,
      points: pointsEarned,
      amount_spent: amountSpent,
      notes: `Tích điểm tự động từ đơn hàng #${orderId.slice(0, 8)}`,
    };

    try {
      const { data, error: txErr } = await supabase.from("loyalty_transactions").insert([rowTx]).select().single();
      if (txErr) {
        console.error(
          "[Loyalty] applyEarning INSERT failed. Error:",
          JSON.stringify(txErr, Object.getOwnPropertyNames(txErr)),
          "Payload:",
          JSON.stringify(rowTx),
        );
        if (this.isTableMissing(txErr)) {
          this.applyLocalEarning(orgId, customerId, orderId, pointsEarned, amountSpent);
          return;
        }
        if (txErr.code === "42501") {
          console.warn(
            "[Loyalty] RLS blocked applyEarning — run loyalty_fix_v2.sql in Supabase Dashboard. Falling back to localStorage.",
          );
          this.applyLocalEarning(orgId, customerId, orderId, pointsEarned, amountSpent);
          return;
        }
        throw txErr;
      }
      console.info(
        "[Loyalty] ✅ Earned",
        pointsEarned,
        "points for customer",
        customerId,
        "order",
        orderId.slice(0, 8),
      );
    } catch (e) {
      console.error("[Loyalty] applyEarning exception:", e);
      this.applyLocalEarning(orgId, customerId, orderId, pointsEarned, amountSpent);
    }
  },

  // ----------------------------------------------------
  // LOCALSTORAGE EMULATORS (FALLBACK LAYER)
  // ----------------------------------------------------
  getLocalProgram(orgId: string): LoyaltyProgram {
    if (typeof window === "undefined") return this.getHardcodedProgram(orgId);
    const key = STORAGE_PREFIX + "program_" + orgId;
    const data = localStorage.getItem(key);
    if (!data) {
      const defaults = this.getHardcodedProgram(orgId);
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  getHardcodedProgram(orgId: string): LoyaltyProgram {
    return {
      id: "p-default",
      organization_id: orgId,
      is_enabled: true, // Enable by default locally for immediate wow factor!
      point_name: "Điểm ZPoint",
      expiration_months: 12,
      birthday_bonus_points: 0,
      first_purchase_bonus_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async createDefaultProgram(orgId: string): Promise<LoyaltyProgram> {
    const supabase = createClient();
    const row = this.getHardcodedProgram(orgId);
    const { id: _omitId, ...rowWithoutId } = row;
    try {
      const { data, error } = await supabase.from("loyalty_programs").insert([rowWithoutId]).select().single();
      if (error) throw error;
      return data || row;
    } catch {
      return row;
    }
  },

  updateLocalProgram(orgId: string, payload: Partial<LoyaltyProgram>): LoyaltyProgram {
    if (typeof window === "undefined") return this.getHardcodedProgram(orgId);
    const current = this.getLocalProgram(orgId);
    const updated = { ...current, ...payload, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_PREFIX + "program_" + orgId, JSON.stringify(updated));
    return updated;
  },

  getLocalTiers(orgId: string): LoyaltyTier[] {
    if (typeof window === "undefined") return this.getHardcodedTiers(orgId);
    const key = STORAGE_PREFIX + "tiers_" + orgId;
    const data = localStorage.getItem(key);
    if (!data) {
      const defaults = this.getHardcodedTiers(orgId);
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  getHardcodedTiers(orgId: string): LoyaltyTier[] {
    return [
      { id: "t-bronze", organization_id: orgId, name: "Đồng (Bronze)", min_points: 0, points_multiplier: 1.0 },
      { id: "t-silver", organization_id: orgId, name: "Bạc (Silver)", min_points: 100, points_multiplier: 1.2 },
      { id: "t-gold", organization_id: orgId, name: "Vàng (Gold)", min_points: 500, points_multiplier: 1.5 },
      {
        id: "t-platinum",
        organization_id: orgId,
        name: "Bạch Kim (Platinum)",
        min_points: 1500,
        points_multiplier: 2.0,
      },
    ];
  },

  async seedDefaultTiers(orgId: string): Promise<LoyaltyTier[]> {
    const supabase = createClient();
    const defaults = this.getHardcodedTiers(orgId);
    const rowsForInsert = defaults.map(({ id: _omit, ...rest }) => rest);
    try {
      const { data } = await supabase.from("loyalty_tiers").insert(rowsForInsert).select();
      return data && data.length > 0 ? data : defaults;
    } catch {
      return defaults;
    }
  },

  createLocalTier(orgId: string, row: any): LoyaltyTier {
    if (typeof window === "undefined") return row;
    const tiers = this.getLocalTiers(orgId);
    const newTier = {
      ...row,
      id: "tier-" + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tiers.push(newTier);
    localStorage.setItem(STORAGE_PREFIX + "tiers_" + orgId, JSON.stringify(tiers));
    return newTier;
  },

  updateLocalTier(orgId: string, id: string, payload: Partial<LoyaltyTier>): LoyaltyTier {
    if (typeof window === "undefined")
      return { id, organization_id: orgId, name: "", min_points: 0, points_multiplier: 1.0 };
    const tiers = this.getLocalTiers(orgId);
    const idx = tiers.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Không tìm thấy hạng thành viên");
    tiers[idx] = { ...tiers[idx], ...payload, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_PREFIX + "tiers_" + orgId, JSON.stringify(tiers));
    return tiers[idx];
  },

  deleteLocalTier(orgId: string, id: string): boolean {
    if (typeof window === "undefined") return true;
    const tiers = this.getLocalTiers(orgId);
    const filtered = tiers.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_PREFIX + "tiers_" + orgId, JSON.stringify(filtered));
    return true;
  },

  getLocalRules(orgId: string): LoyaltyRule[] {
    if (typeof window === "undefined") return this.getHardcodedRules(orgId);
    const key = STORAGE_PREFIX + "rules_" + orgId;
    const data = localStorage.getItem(key);
    if (!data) {
      const defaults = this.getHardcodedRules(orgId);
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  getHardcodedRules(orgId: string): LoyaltyRule[] {
    return [
      {
        id: "r-spend",
        organization_id: orgId,
        name: "Tích 1 điểm cho mỗi 10,000 VND chi tiêu",
        rule_type: "earning_spend",
        spend_amount: 10000,
        points_awarded: 1,
        is_active: true,
      },
      {
        id: "r-redeem",
        organization_id: orgId,
        name: "Đổi 100 điểm lấy 10,000 VND giảm giá",
        rule_type: "redemption_discount",
        points_required: 100,
        discount_amount: 10000,
        min_points_to_redeem: 50,
        max_discount_percentage: 30,
        allow_on_discounted_orders: false,
        is_active: true,
      },
    ];
  },

  async seedDefaultRules(orgId: string): Promise<LoyaltyRule[]> {
    const supabase = createClient();
    const defaults = this.getHardcodedRules(orgId);
    const rowsForInsert = defaults.map(({ id: _omit, ...rest }) => rest);
    try {
      const { data } = await supabase.from("loyalty_rules").insert(rowsForInsert).select();
      return data && data.length > 0 ? data : defaults;
    } catch {
      return defaults;
    }
  },

  createLocalRule(orgId: string, row: any): LoyaltyRule {
    if (typeof window === "undefined") return row;
    const rules = this.getLocalRules(orgId);
    const newRule = {
      ...row,
      id: "rule-" + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    rules.push(newRule);
    localStorage.setItem(STORAGE_PREFIX + "rules_" + orgId, JSON.stringify(rules));
    return newRule;
  },

  updateLocalRule(orgId: string, id: string, payload: Partial<LoyaltyRule>): LoyaltyRule {
    if (typeof window === "undefined")
      return { id, organization_id: orgId, name: "", rule_type: "earning_spend", is_active: true };
    const rules = this.getLocalRules(orgId);
    const idx = rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Không tìm thấy quy tắc");
    rules[idx] = { ...rules[idx], ...payload, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_PREFIX + "rules_" + orgId, JSON.stringify(rules));
    return rules[idx];
  },

  deleteLocalRule(orgId: string, id: string): boolean {
    if (typeof window === "undefined") return true;
    const rules = this.getLocalRules(orgId);
    const filtered = rules.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_PREFIX + "rules_" + orgId, JSON.stringify(filtered));
    return true;
  },

  getLocalCampaigns(orgId: string): LoyaltyCampaign[] {
    if (typeof window === "undefined") return [];
    const key = STORAGE_PREFIX + "campaigns_" + orgId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  createLocalCampaign(orgId: string, row: any): LoyaltyCampaign {
    if (typeof window === "undefined") return row;
    const campaigns = this.getLocalCampaigns(orgId);
    const newCamp = {
      ...row,
      id: "camp-" + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    campaigns.push(newCamp);
    localStorage.setItem(STORAGE_PREFIX + "campaigns_" + orgId, JSON.stringify(campaigns));
    return newCamp;
  },

  updateLocalCampaign(orgId: string, id: string, payload: Partial<LoyaltyCampaign>): LoyaltyCampaign {
    if (typeof window === "undefined")
      return {
        id,
        organization_id: orgId,
        name: "",
        campaign_type: "double_points",
        points_multiplier: 1.0,
        bonus_points: 0,
        is_active: true,
      };
    const campaigns = this.getLocalCampaigns(orgId);
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Không tìm thấy chiến dịch");
    campaigns[idx] = { ...campaigns[idx], ...payload, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_PREFIX + "campaigns_" + orgId, JSON.stringify(campaigns));
    return campaigns[idx];
  },

  deleteLocalCampaign(orgId: string, id: string): boolean {
    if (typeof window === "undefined") return true;
    const campaigns = this.getLocalCampaigns(orgId);
    const filtered = campaigns.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_PREFIX + "campaigns_" + orgId, JSON.stringify(filtered));
    return true;
  },

  getLocalCustomerBalance(orgId: string, customerId: string): CustomerLoyaltyBalance {
    if (typeof window === "undefined") return this.createEmptyCustomerBalance(orgId, customerId);
    const key = STORAGE_PREFIX + "balance_" + customerId;
    const data = localStorage.getItem(key);
    if (!data) {
      // Find customer's legacy points if available
      let points = 0;
      try {
        const rawCust = localStorage.getItem("zpos_customers_" + orgId) || localStorage.getItem("zpos_customers");
        if (rawCust) {
          const list = JSON.parse(rawCust);
          const cust = list.find((c: any) => c.id === customerId);
          if (cust?.loyalty_points) points = cust.loyalty_points;
        }
      } catch {}

      const balance = this.createEmptyCustomerBalance(orgId, customerId);
      balance.current_points = points;
      balance.lifetime_points = points;

      // Seed initial tier based on points
      const tiers = this.getLocalTiers(orgId);
      const tier = tiers
        .slice()
        .reverse()
        .find((t) => t.min_points <= points);
      if (tier) {
        balance.tier_id = tier.id;
        balance.tier = tier;
      }

      localStorage.setItem(key, JSON.stringify(balance));
      return balance;
    }

    const balance: CustomerLoyaltyBalance = JSON.parse(data);
    // Bind tier object in memory
    const tiers = this.getLocalTiers(orgId);
    if (balance.tier_id) {
      balance.tier = tiers.find((t) => t.id === balance.tier_id) || null;
    } else {
      const tier = tiers
        .slice()
        .reverse()
        .find((t) => t.min_points <= balance.lifetime_points);
      if (tier) {
        balance.tier_id = tier.id;
        balance.tier = tier;
      }
    }
    return balance;
  },

  createEmptyCustomerBalance(orgId: string, customerId: string): CustomerLoyaltyBalance {
    return {
      id: "bal-" + customerId.slice(0, 8),
      organization_id: orgId,
      customer_id: customerId,
      current_points: 0,
      lifetime_points: 0,
      tier_id: "t-bronze",
      tier: { id: "t-bronze", organization_id: orgId, name: "Đồng (Bronze)", min_points: 0, points_multiplier: 1.0 },
      updated_at: new Date().toISOString(),
    };
  },

  getLocalTransactions(orgId: string, customerId?: string): LoyaltyTransaction[] {
    if (typeof window === "undefined") return [];
    const key = STORAGE_PREFIX + "transactions_" + orgId;
    const data = localStorage.getItem(key);
    let list: LoyaltyTransaction[] = data ? JSON.parse(data) : [];
    if (customerId) {
      list = list.filter((t) => t.customer_id === customerId);
    }
    return list;
  },

  createLocalTransaction(orgId: string, row: any): LoyaltyTransaction {
    if (typeof window === "undefined") return row;
    const key = STORAGE_PREFIX + "transactions_" + orgId;
    const data = localStorage.getItem(key);
    const list: LoyaltyTransaction[] = data ? JSON.parse(data) : [];

    // Attempt to resolve customer name from localStorage
    let custName = "Khách hàng";
    let custPhone = "";
    try {
      const raw = localStorage.getItem("zpos_customers");
      if (raw) {
        const custList = JSON.parse(raw);
        const c = custList.find((item: any) => item.id === row.customer_id);
        if (c) {
          custName = c.name;
          custPhone = c.phone || "";
        }
      }
    } catch {}

    const newTx: LoyaltyTransaction = {
      ...row,
      id: "tx-" + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      customer: { name: custName, phone: custPhone },
    };
    list.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(list));

    // Update customer local balances & sync to customer table
    this.recalculateLocalBalance(orgId, row.customer_id, list);
    return newTx;
  },

  recalculateLocalBalance(orgId: string, customerId: string, allTx: LoyaltyTransaction[]): void {
    const custTx = allTx.filter((t) => t.customer_id === customerId);
    const currentPoints = custTx.reduce((sum, t) => sum + t.points, 0);
    const lifetimePoints = custTx.filter((t) => t.points > 0).reduce((sum, t) => sum + t.points, 0);

    const tiers = this.getLocalTiers(orgId);
    const newTier =
      tiers
        .slice()
        .reverse()
        .find((t) => t.min_points <= lifetimePoints) || null;

    const balance: CustomerLoyaltyBalance = {
      id: "bal-" + customerId.slice(0, 8),
      organization_id: orgId,
      customer_id: customerId,
      current_points: currentPoints,
      lifetime_points: lifetimePoints,
      tier_id: newTier?.id || null,
      tier: newTier,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_PREFIX + "balance_" + customerId, JSON.stringify(balance));

    // Sync back to customers table in localStorage
    try {
      const rawCust = localStorage.getItem("zpos_customers");
      if (rawCust) {
        const list = JSON.parse(rawCust);
        const idx = list.findIndex((c: any) => c.id === customerId);
        if (idx !== -1) {
          list[idx].loyalty_points = currentPoints;
          localStorage.setItem("zpos_customers", JSON.stringify(list));
        }
      }
    } catch {}
  },

  applyLocalRedemption(
    orgId: string,
    customerId: string,
    orderId: string,
    pointsRedeemed: number,
    discountApplied: number,
  ): void {
    const rowTx = {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      transaction_type: "redeem" as const,
      points: -pointsRedeemed,
      amount_spent: 0,
      notes: `Đổi điểm thanh toán đơn hàng #${orderId.slice(0, 8)}`,
    };
    this.createLocalTransaction(orgId, rowTx);

    // Save redemption
    if (typeof window !== "undefined") {
      const rKey = STORAGE_PREFIX + "redemptions_" + orgId;
      const data = localStorage.getItem(rKey);
      const list = data ? JSON.parse(data) : [];
      list.unshift({
        id: "red-" + Math.random().toString(36).substr(2, 9),
        organization_id: orgId,
        customer_id: customerId,
        order_id: orderId,
        points_redeemed: pointsRedeemed,
        discount_applied: discountApplied,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(rKey, JSON.stringify(list));
    }
  },

  applyLocalEarning(
    orgId: string,
    customerId: string,
    orderId: string,
    pointsEarned: number,
    amountSpent: number,
  ): void {
    const rowTx = {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      transaction_type: "earn" as const,
      points: pointsEarned,
      amount_spent: amountSpent,
      notes: `Tích điểm tự động từ đơn hàng #${orderId.slice(0, 8)}`,
    };
    this.createLocalTransaction(orgId, rowTx);
  },
};
