import { createClient } from "@/utils/supabase/client";
import { permissionService } from "./permission.service";
import { telegramService } from "./telegram.service";
import { isValidUUID } from "./pos.service";

// Sanitize id-like value to null nếu không phải UUID. Tránh các id local
// (prefix "reg-", "shift-") bị gửi vào RPC/insert lên cột uuid.
function uuidOrNull(value?: string | null): string | null {
  return value && isValidUUID(value) ? value : null;
}

// ============================================================================
// Types
// ============================================================================
export type ShiftStatus = "open" | "closed" | "reviewed" | "cancelled";

export type ShiftTransactionType =
  | "opening_cash"
  | "sale"
  | "refund"
  | "cash_in"
  | "cash_out"
  | "expense"
  | "closing_cash"
  | "adjustment";

export type PaymentMethod = "cash" | "bank_transfer" | "vietqr" | "card" | "momo" | "zalopay" | "debt" | "other";

export interface CashRegister {
  id: string;
  organization_id: string;
  branch_id: string;
  name: string;
  code?: string | null;
  status: "active" | "inactive" | "maintenance";
  created_at?: string;
  updated_at?: string;
  branch?: { id: string; name: string } | null;
}

export interface Shift {
  id: string;
  organization_id: string;
  branch_id: string;
  cash_register_id?: string | null;
  cashier_id: string;
  status: ShiftStatus;

  opened_at: string;
  closed_at?: string | null;

  opening_cash_amount: number;
  expected_cash_amount: number;
  counted_cash_amount: number;
  cash_difference: number;

  total_sales_amount: number;
  cash_sales_amount: number;
  bank_transfer_amount: number;
  vietqr_amount: number;
  card_amount: number;
  momo_amount: number;
  zalopay_amount: number;
  debt_amount: number;
  refund_amount: number;
  expense_amount: number;

  total_orders: number;
  cancelled_orders: number;

  note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;

  created_at?: string;
  updated_at?: string;

  // joined
  branch?: { id: string; name: string } | null;
  cash_register?: { id: string; name: string; code?: string | null } | null;
  cashier?: { id: string; full_name?: string | null; email?: string | null } | null;
  reviewer?: { id: string; full_name?: string | null } | null;
}

export interface ShiftTransaction {
  id: string;
  organization_id: string;
  shift_id: string;
  branch_id?: string | null;
  type: ShiftTransactionType;
  amount: number;
  payment_method?: PaymentMethod | null;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface CashCount {
  id: string;
  organization_id: string;
  shift_id: string;
  count_type: "opening" | "closing";
  denomination: number;
  quantity: number;
  total_amount: number;
  created_at?: string;
}

export interface OpenShiftPayload {
  branch_id: string;
  cash_register_id?: string | null;
  opening_cash_amount: number;
  note?: string;
}

export interface CloseShiftPayload {
  shift_id: string;
  counted_cash_amount: number;
  note?: string;
  cash_counts?: Array<{ denomination: number; quantity: number }>;
}

export type ShiftAssignmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed";

export interface ShiftAssignment {
  id: string;
  organization_id: string;
  employee_id: string;
  profile_id?: string | null;
  branch_id?: string | null;
  title: string;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  status: ShiftAssignmentStatus;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: { id: string; name?: string | null; email?: string | null } | null;
  branch?: { id: string; name?: string | null } | null;
}

export interface ShiftAssignmentPayload {
  employee_id: string;
  profile_id?: string | null;
  branch_id?: string | null;
  title: string;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes?: number;
  status?: ShiftAssignmentStatus;
  note?: string | null;
}

// ============================================================================
// Local-storage fallback keys
// ============================================================================
const STORAGE_PREFIX = "zpos_shifts_";
const REG_KEY = (orgId: string) => `${STORAGE_PREFIX}registers_${orgId}`;
const SHIFT_KEY = (orgId: string) => `${STORAGE_PREFIX}list_${orgId}`;
const TX_KEY = (orgId: string) => `${STORAGE_PREFIX}tx_${orgId}`;
const COUNT_KEY = (orgId: string) => `${STORAGE_PREFIX}counts_${orgId}`;
const ASSIGNMENT_KEY = (orgId: string) => `${STORAGE_PREFIX}assignments_${orgId}`;
const ACTIVE_SHIFT_CACHE_KEY = `${STORAGE_PREFIX}active_shift_cache`;

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function activeShiftCacheKey(orgId: string, userId: string) {
  return `${orgId}:${userId}`;
}

function notifyShiftClosed(shiftId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("zpos_shift_closed", { detail: { shiftId } }));
}

const VND_DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];

export const shiftService = {
  isTableMissing(error: any): boolean {
    return permissionService.isTableMissingError(error);
  },

  vndDenominations(): number[] {
    return [...VND_DENOMINATIONS];
  },

  async resolveOpenShiftBranchId(branchId?: string | null): Promise<string | null> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();

    if (branchId && uuidOrNull(branchId)) {
      const { data: branch, error } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", orgId)
        .eq("id", branchId)
        .maybeSingle();
      if (!error && branch?.id) return branch.id;
    }

    const { data: existing, error: existingError } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", orgId)
      .order("is_main_branch", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!existingError && existing?.id) return existing.id;

    const { data: created, error: createError } = await supabase
      .from("branches")
      .insert([
        {
          organization_id: orgId,
          name: "Chi nhánh chính",
          address: "",
          phone: "",
          is_main_branch: true,
        },
      ])
      .select("id")
      .single();

    if (createError || !created?.id) return null;
    return created.id;
  },

  // --------------------------------------------------------------------------
  // Cash registers
  // --------------------------------------------------------------------------
  async getRegisters(branchId?: string): Promise<CashRegister[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    let dbRows: CashRegister[] = [];
    let tableMissing = false;
    try {
      // Plain select — no PostgREST embed. The embed `branch:branches(...)`
      // can throw HTTP 409 right after a fresh migration because the relation
      // cache hasn't picked up the new FK yet. Branches are joined in JS by
      // the caller from its own branch list.
      let q = supabase
        .from("cash_registers")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true });
      if (branchId) q = q.eq("branch_id", branchId);
      const { data, error } = await q;
      if (error) {
        if (this.isTableMissing(error)) tableMissing = true;
        else throw error;
      } else {
        dbRows = data || [];
      }
    } catch (e) {
      console.warn("getRegisters DB query failed, falling back to local:", e);
      tableMissing = true;
    }

    // Always merge any local-only registers (e.g. created while offline or
    // when the table was missing) so the user still sees them after refresh.
    const local = readLocal<CashRegister[]>(REG_KEY(orgId), []);
    const dbIds = new Set(dbRows.map((r) => r.id));
    const localOnly = local.filter((r) => !dbIds.has(r.id) && (!branchId || r.branch_id === branchId));
    return tableMissing ? local.filter((r) => !branchId || r.branch_id === branchId) : [...dbRows, ...localOnly];
  },

  async createRegister(
    payload: Omit<CashRegister, "id" | "organization_id" | "created_at" | "updated_at" | "branch">,
  ): Promise<CashRegister> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const row = { ...payload, organization_id: orgId };
    try {
      // Avoid .single() — if RLS hides the just-inserted row on RETURNING,
      // PostgREST returns 409 PGRST116. Use array form and grab the first row.
      const { data, error } = await supabase.from("cash_registers").insert([row]).select();
      if (error) {
        if (this.isTableMissing(error)) {
          console.warn("cash_registers table missing — saving to localStorage");
          return this.createLocalRegister(orgId, row as any);
        }
        // Real DB error (RLS / FK / NOT NULL / etc) — bubble up so the UI can
        // surface the message instead of silently storing a "ghost" row that
        // will never show up after refresh.
        const wrapped = new Error(error.message || error.details || error.hint || "Không thể tạo máy thu ngân");
        (wrapped as any).code = error.code;
        (wrapped as any).pg = error;
        throw wrapped;
      }
      await permissionService.createAuditLog(orgId, userId, "shifts.register_create", { name: payload.name });
      // If RLS allowed insert but not select-back, fall through to local
      // representation so the UI still has something to show. Refresh will
      // surface the real row once RLS catches up.
      if (data && data.length > 0) return data[0] as CashRegister;
      return this.createLocalRegister(orgId, row as any);
    } catch (e: any) {
      // Only fall back to local for connectivity issues — keep validation
      // errors loud so the user fixes the root cause.
      const msg = String(e?.message || "").toLowerCase();
      const isNetwork =
        msg.includes("fetch") || msg.includes("network") || msg.includes("timeout") || msg.includes("failed to fetch");
      if (isNetwork) {
        console.warn("Network error, saving register to localStorage:", e?.message);
        return this.createLocalRegister(orgId, row as any);
      }
      throw e;
    }
  },

  createLocalRegister(orgId: string, row: any): CashRegister {
    const list = readLocal<CashRegister[]>(REG_KEY(orgId), []);
    const reg: CashRegister = {
      ...row,
      id: "reg-" + Math.random().toString(36).slice(2, 10),
      status: row.status || "active",
      created_at: new Date().toISOString(),
    };
    list.push(reg);
    writeLocal(REG_KEY(orgId), list);
    return reg;
  },

  async updateRegister(id: string, payload: Partial<CashRegister>): Promise<CashRegister> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      const { data, error } = await supabase
        .from("cash_registers")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const list = readLocal<CashRegister[]>(REG_KEY(orgId), []);
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload, updated_at: new Date().toISOString() };
        writeLocal(REG_KEY(orgId), list);
        return list[idx];
      }
      throw new Error("Không tìm thấy máy thu ngân");
    }
  },

  async deleteRegister(id: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      const { error } = await supabase.from("cash_registers").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch {
      const list = readLocal<CashRegister[]>(REG_KEY(orgId), []);
      writeLocal(
        REG_KEY(orgId),
        list.filter((r) => r.id !== id),
      );
      return true;
    }
  },

  // --------------------------------------------------------------------------
  // Shifts
  // --------------------------------------------------------------------------
  async listShifts(
    filters: { status?: ShiftStatus; branchId?: string; from?: string; to?: string; limit?: number } = {},
  ): Promise<Shift[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      let q = supabase
        .from("shifts")
        .select(`
          *,
          branch:branches(id, name),
          cash_register:cash_registers(id, name, code),
          cashier:profiles!shifts_cashier_id_fkey(id, full_name, email),
          reviewer:profiles!shifts_reviewed_by_fkey(id, full_name)
        `)
        .eq("organization_id", orgId)
        .order("opened_at", { ascending: false });

      if (filters.status) q = q.eq("status", filters.status);
      if (filters.branchId) q = q.eq("branch_id", filters.branchId);
      if (filters.from) q = q.gte("opened_at", filters.from);
      if (filters.to) q = q.lte("opened_at", filters.to);
      if (filters.limit) q = q.limit(filters.limit);

      const { data, error } = await q;
      if (error) {
        if (this.isTableMissing(error)) return this.listLocalShifts(orgId, filters);
        // join error fallback: try without joins
        const fallback = await supabase
          .from("shifts")
          .select("*")
          .eq("organization_id", orgId)
          .order("opened_at", { ascending: false });
        return fallback.data || [];
      }
      return data || [];
    } catch {
      return this.listLocalShifts(orgId, filters);
    }
  },

  listLocalShifts(orgId: string, filters: any = {}): Shift[] {
    let list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
    if (filters.status) list = list.filter((s) => s.status === filters.status);
    if (filters.branchId) list = list.filter((s) => s.branch_id === filters.branchId);
    return list;
  },

  async getShift(id: string): Promise<Shift | null> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      const { data, error } = await supabase
        .from("shifts")
        .select(`
          *,
          branch:branches(id, name),
          cash_register:cash_registers(id, name, code),
          cashier:profiles!shifts_cashier_id_fkey(id, full_name, email),
          reviewer:profiles!shifts_reviewed_by_fkey(id, full_name)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch {
      const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
      return list.find((s) => s.id === id) || null;
    }
  },

  async getActiveShift(cashRegisterId?: string | null): Promise<Shift | null> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    try {
      // Try RPC first
      const { data: rpcData, error: rpcErr } = await supabase.rpc("get_active_shift", {
        p_organization_id: orgId,
        p_cash_register_id: uuidOrNull(cashRegisterId),
      });
      if (!rpcErr && rpcData?.ok) {
        if (rpcData.shift) {
          const shift = rpcData.shift as Shift;
          this.cacheActiveShift(shift);
          return shift;
        }
        this.clearCachedActiveShift(orgId, userId);
        return null;
      }
    } catch {}

    try {
      let q = supabase
        .from("shifts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("cashier_id", userId)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1);
      const safeRegisterId = uuidOrNull(cashRegisterId);
      if (safeRegisterId) q = q.eq("cash_register_id", safeRegisterId);
      const { data, error } = await q.maybeSingle();
      if (error) {
        if (this.isTableMissing(error))
          return (
            this.getLocalActiveShift(orgId, userId, cashRegisterId) ||
            this.getCachedActiveShift(orgId, userId, cashRegisterId)
          );
        throw error;
      }
      if (data) {
        this.cacheActiveShift(data as Shift);
        return data as Shift;
      }
      this.clearCachedActiveShift(orgId, userId);
      return null;
    } catch {
      return (
        this.getLocalActiveShift(orgId, userId, cashRegisterId) ||
        this.getCachedActiveShift(orgId, userId, cashRegisterId)
      );
    }
  },

  getLocalActiveShift(orgId: string, userId: string, cashRegisterId?: string | null): Shift | null {
    const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
    return (
      list.find(
        (s) =>
          s.status === "open" && s.cashier_id === userId && (!cashRegisterId || s.cash_register_id === cashRegisterId),
      ) || null
    );
  },

  getCachedActiveShift(orgId: string, userId: string, cashRegisterId?: string | null): Shift | null {
    if (!orgId || !userId) return null;
    const cache = readLocal<Record<string, Shift>>(ACTIVE_SHIFT_CACHE_KEY, {});
    const cached = cache[activeShiftCacheKey(orgId, userId)];
    if (!cached || cached.status !== "open") return null;
    if (cashRegisterId && cached.cash_register_id && cached.cash_register_id !== cashRegisterId) return null;
    return cached;
  },

  cacheActiveShift(shift: Shift | null | undefined): void {
    if (!shift || shift.status !== "open") return;
    const cache = readLocal<Record<string, Shift>>(ACTIVE_SHIFT_CACHE_KEY, {});
    cache[activeShiftCacheKey(shift.organization_id, shift.cashier_id)] = shift;
    writeLocal(ACTIVE_SHIFT_CACHE_KEY, cache);
  },

  clearCachedActiveShift(orgId: string, userId: string): void {
    const cache = readLocal<Record<string, Shift>>(ACTIVE_SHIFT_CACHE_KEY, {});
    delete cache[activeShiftCacheKey(orgId, userId)];
    writeLocal(ACTIVE_SHIFT_CACHE_KEY, cache);
  },

  async getPreviousShiftNote(branchId: string, cashRegisterId?: string): Promise<string | null> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    let q = supabase
      .from("shifts")
      .select("note")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .not("note", "is", null)
      .neq("note", "")
      .order("opened_at", { ascending: false })
      .limit(1);

    if (cashRegisterId) {
      q = q.eq("cash_register_id", cashRegisterId);
    }

    const { data } = await q.maybeSingle();
    return data?.note || null;
  },

  async openShift(payload: OpenShiftPayload): Promise<{ ok: boolean; shift?: Shift; error?: string }> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canOpen = await permissionService.hasPermission("shifts.open");
    if (!canOpen) return { ok: false, error: "Bạn không có quyền mở ca." };

    try {
      const resolvedBranchId = await this.resolveOpenShiftBranchId(payload.branch_id);
      if (!resolvedBranchId) {
        return { ok: false, error: "Không tìm thấy hoặc không tạo được chi nhánh để mở ca." };
      }
      const safePayload = { ...payload, branch_id: resolvedBranchId };

      const { data, error } = await supabase.rpc("open_shift", {
        p_branch_id: safePayload.branch_id,
        p_cash_register_id: uuidOrNull(safePayload.cash_register_id),
        p_opening_cash: safePayload.opening_cash_amount || 0,
        p_note: safePayload.note || null,
      });
      if (error) throw error;
      if (data && !data.ok) {
        if (data.error === "shift_already_open" && data.shift_id) {
          const existingShift =
            (await this.getShift(data.shift_id)) || (await this.getActiveShift(safePayload.cash_register_id));
          if (existingShift) {
            this.cacheActiveShift(existingShift);
            return { ok: true, shift: existingShift };
          }
        }
        return { ok: false, error: data.error };
      }

      const shift = data?.shift_id ? await this.getShift(data.shift_id) : null;
      const openedShift =
        shift || (data?.shift_id ? this.buildOpenShiftSnapshot(data.shift_id, orgId, userId, safePayload) : null);
      await permissionService.createAuditLog(orgId, userId, "shifts.open", {
        shift_id: data?.shift_id,
        opening_cash: safePayload.opening_cash_amount,
        branch_id: safePayload.branch_id,
      });
      this.cacheActiveShift(openedShift || undefined);
      return { ok: true, shift: openedShift || undefined };
    } catch (e: any) {
      // fallback local
      const shift = this.createLocalShift(orgId, userId, payload);
      this.cacheActiveShift(shift);
      await permissionService.createAuditLog(orgId, userId, "shifts.open", {
        shift_id: shift.id,
        opening_cash: payload.opening_cash_amount,
        branch_id: payload.branch_id,
        local: true,
      });
      return { ok: true, shift };
    }
  },

  createLocalShift(orgId: string, userId: string, payload: OpenShiftPayload): Shift {
    const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
    const shift = this.buildOpenShiftSnapshot(
      "shift-" + Math.random().toString(36).slice(2, 10),
      orgId,
      userId,
      payload,
    );
    list.push(shift);
    writeLocal(SHIFT_KEY(orgId), list);

    this.appendLocalTransaction(orgId, {
      organization_id: orgId,
      shift_id: shift.id,
      branch_id: payload.branch_id,
      type: "opening_cash",
      amount: payload.opening_cash_amount,
      payment_method: "cash",
      note: "Tiền mặt đầu ca",
      created_by: userId,
    });

    return shift;
  },

  buildOpenShiftSnapshot(id: string, orgId: string, userId: string, payload: OpenShiftPayload): Shift {
    const now = new Date().toISOString();
    return {
      id,
      organization_id: orgId,
      branch_id: payload.branch_id,
      cash_register_id: payload.cash_register_id ?? null,
      cashier_id: userId,
      status: "open",
      opened_at: now,
      closed_at: null,
      opening_cash_amount: payload.opening_cash_amount,
      expected_cash_amount: payload.opening_cash_amount,
      counted_cash_amount: 0,
      cash_difference: 0,
      total_sales_amount: 0,
      cash_sales_amount: 0,
      bank_transfer_amount: 0,
      vietqr_amount: 0,
      card_amount: 0,
      momo_amount: 0,
      zalopay_amount: 0,
      debt_amount: 0,
      refund_amount: 0,
      expense_amount: 0,
      total_orders: 0,
      cancelled_orders: 0,
      note: payload.note,
      created_at: now,
      updated_at: now,
    };
  },

  async aggregateShift(shiftId: string): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.rpc("aggregate_shift", { p_shift_id: shiftId });
    } catch (e) {
      // ignore — close path will re-aggregate locally
    }
  },

  async closeShift(
    payload: CloseShiftPayload,
  ): Promise<{ ok: boolean; shift?: Shift; expected?: number; counted?: number; difference?: number; error?: string }> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canClose = await permissionService.hasPermission("shifts.close");
    if (!canClose) return { ok: false, error: "Bạn không có quyền đóng ca." };

    // Persist cash count denominations first (best-effort)
    if (payload.cash_counts && payload.cash_counts.length > 0) {
      await this.saveCashCounts(payload.shift_id, "closing", payload.cash_counts);
    }

    try {
      const { data, error } = await supabase.rpc("close_shift", {
        p_shift_id: payload.shift_id,
        p_counted_cash: payload.counted_cash_amount || 0,
        p_note: payload.note || null,
      });
      if (error) throw error;
      if (data && !data.ok) return { ok: false, error: data.error };

      const shift = await this.getShift(payload.shift_id);
      await permissionService.createAuditLog(orgId, userId, "shifts.close", {
        shift_id: payload.shift_id,
        counted_cash: payload.counted_cash_amount,
        difference: data?.difference,
      });
      this.clearCachedActiveShift(orgId, userId);
      notifyShiftClosed(payload.shift_id);

      if (shift) {
        telegramService
          .notifyShiftClosed({
            employeeName: (shift as any).cashier?.full_name || "Nhân viên",
            opening: shift.opening_cash_amount || 0,
            sales: shift.cash_sales_amount || 0,
            refund: shift.refund_amount || 0,
            expense: shift.expense_amount || 0,
            actualCash: payload.counted_cash_amount,
            difference: data?.difference || 0,
          })
          .catch((e) => console.warn("Telegram notify failed:", e));
      }

      return {
        ok: true,
        shift: shift || undefined,
        expected: data?.expected_cash,
        counted: data?.counted_cash,
        difference: data?.difference,
      };
    } catch {
      // local fallback
      const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
      const idx = list.findIndex((s) => s.id === payload.shift_id);
      if (idx < 0) return { ok: false, error: "shift_not_found" };
      const expected = this.computeExpectedCashLocal(orgId, payload.shift_id);
      const diff = payload.counted_cash_amount - expected;
      list[idx] = {
        ...list[idx],
        status: "closed",
        closed_at: new Date().toISOString(),
        expected_cash_amount: expected,
        counted_cash_amount: payload.counted_cash_amount,
        cash_difference: diff,
        note: payload.note ?? list[idx].note,
      };
      writeLocal(SHIFT_KEY(orgId), list);

      this.appendLocalTransaction(orgId, {
        organization_id: orgId,
        shift_id: payload.shift_id,
        branch_id: list[idx].branch_id,
        type: "closing_cash",
        amount: payload.counted_cash_amount,
        payment_method: "cash",
        note: diff === 0 ? "Đóng ca khớp tiền" : diff > 0 ? "Đóng ca dư tiền" : "Đóng ca thiếu tiền",
        created_by: userId,
      });

      await permissionService.createAuditLog(orgId, userId, "shifts.close", {
        shift_id: payload.shift_id,
        counted_cash: payload.counted_cash_amount,
        difference: diff,
        local: true,
      });
      this.clearCachedActiveShift(orgId, userId);
      notifyShiftClosed(payload.shift_id);

      if (list[idx]) {
        telegramService
          .notifyShiftClosed({
            employeeName: "Nhân viên (Local)",
            opening: list[idx].opening_cash_amount || 0,
            sales: list[idx].cash_sales_amount || 0,
            refund: list[idx].refund_amount || 0,
            expense: list[idx].expense_amount || 0,
            actualCash: payload.counted_cash_amount,
            difference: diff || 0,
          })
          .catch((e) => console.warn("Telegram notify failed:", e));
      }

      return { ok: true, shift: list[idx], expected, counted: payload.counted_cash_amount, difference: diff };
    }
  },

  computeExpectedCashLocal(orgId: string, shiftId: string): number {
    const txs = readLocal<ShiftTransaction[]>(TX_KEY(orgId), []).filter((t) => t.shift_id === shiftId);
    let opening = 0;
    let cash = 0;
    let expense = 0;
    let refund = 0;
    for (const t of txs) {
      if (t.type === "opening_cash") opening += Number(t.amount || 0);
      if (t.type === "sale" && t.payment_method === "cash") cash += Number(t.amount || 0);
      if (t.type === "expense") expense += Number(t.amount || 0);
      if (t.type === "refund") refund += Number(t.amount || 0);
      if (t.type === "cash_in") cash += Number(t.amount || 0);
      if (t.type === "cash_out") expense += Number(t.amount || 0);
    }
    return opening + cash - expense - refund;
  },

  async reviewShift(shiftId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canReview = await permissionService.hasPermission("shifts.review");
    if (!canReview) return { ok: false, error: "Bạn không có quyền duyệt ca." };

    try {
      const { data, error } = await supabase.rpc("review_shift", { p_shift_id: shiftId, p_note: note || null });
      if (error) throw error;
      if (data && !data.ok) return { ok: false, error: data.error };
      await permissionService.createAuditLog(orgId, userId, "shifts.review", { shift_id: shiftId });
      return { ok: true };
    } catch (e: any) {
      const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
      const idx = list.findIndex((s) => s.id === shiftId);
      if (idx < 0) return { ok: false, error: "shift_not_found" };
      list[idx] = {
        ...list[idx],
        status: "reviewed",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        note: note ?? list[idx].note,
      };
      writeLocal(SHIFT_KEY(orgId), list);
      await permissionService.createAuditLog(orgId, userId, "shifts.review", { shift_id: shiftId, local: true });
      return { ok: true };
    }
  },

  async cancelShift(shiftId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canAdjust = await permissionService.hasPermission("shifts.adjust");
    if (!canAdjust) return { ok: false, error: "Bạn không có quyền huỷ ca." };

    try {
      const { error } = await supabase
        .from("shifts")
        .update({ status: "cancelled", note: reason, updated_at: new Date().toISOString() })
        .eq("id", shiftId);
      if (error) throw error;
      await permissionService.createAuditLog(orgId, userId, "shifts.cancel", { shift_id: shiftId, reason });
      return { ok: true };
    } catch {
      const list = readLocal<Shift[]>(SHIFT_KEY(orgId), []);
      const idx = list.findIndex((s) => s.id === shiftId);
      if (idx < 0) return { ok: false, error: "shift_not_found" };
      list[idx] = { ...list[idx], status: "cancelled", note: reason };
      writeLocal(SHIFT_KEY(orgId), list);
      return { ok: true };
    }
  },

  async adjustDifference(shiftId: string, newDifference: number, reason: string): Promise<{ ok: boolean }> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    const canAdjust = await permissionService.hasPermission("shifts.adjust");
    if (!canAdjust) throw new Error("Bạn không có quyền điều chỉnh số liệu ca.");

    try {
      const { error } = await supabase
        .from("shifts")
        .update({ cash_difference: newDifference, note: reason, updated_at: new Date().toISOString() })
        .eq("id", shiftId);
      if (error) throw error;
      await this.addTransaction({
        shift_id: shiftId,
        type: "adjustment",
        amount: newDifference,
        payment_method: "cash",
        note: `Điều chỉnh chênh lệch — ${reason}`,
      });
      await permissionService.createAuditLog(orgId, userId, "shifts.adjust", {
        shift_id: shiftId,
        new_difference: newDifference,
        reason,
      });
      return { ok: true };
    } catch {
      return { ok: false } as any;
    }
  },

  // --------------------------------------------------------------------------
  // Shift transactions
  // --------------------------------------------------------------------------
  async getTransactions(shiftId: string): Promise<ShiftTransaction[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      const { data, error } = await supabase
        .from("shift_transactions")
        .select("*")
        .eq("shift_id", shiftId)
        .order("created_at", { ascending: true });
      if (error) {
        if (this.isTableMissing(error))
          return readLocal<ShiftTransaction[]>(TX_KEY(orgId), []).filter((t) => t.shift_id === shiftId);
        throw error;
      }
      return data || [];
    } catch {
      return readLocal<ShiftTransaction[]>(TX_KEY(orgId), []).filter((t) => t.shift_id === shiftId);
    }
  },

  async addTransaction(payload: {
    shift_id: string;
    type: ShiftTransactionType;
    amount: number;
    payment_method?: PaymentMethod;
    reference_type?: string;
    reference_id?: string;
    note?: string;
  }): Promise<ShiftTransaction> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();

    // Resolve branch_id from shift
    const shift = await this.getShift(payload.shift_id);

    const row = {
      organization_id: orgId,
      shift_id: payload.shift_id,
      branch_id: shift?.branch_id || null,
      type: payload.type,
      amount: payload.amount,
      payment_method: payload.payment_method || null,
      reference_type: payload.reference_type || null,
      reference_id: payload.reference_id || null,
      note: payload.note || null,
      created_by: userId,
    };

    try {
      const { data, error } = await supabase.from("shift_transactions").insert([row]).select().single();
      if (error) {
        if (this.isTableMissing(error)) return this.appendLocalTransaction(orgId, row);
        throw error;
      }
      await this.aggregateShift(payload.shift_id);
      return data;
    } catch {
      return this.appendLocalTransaction(orgId, row);
    }
  },

  appendLocalTransaction(orgId: string, row: any): ShiftTransaction {
    const list = readLocal<ShiftTransaction[]>(TX_KEY(orgId), []);
    const tx: ShiftTransaction = {
      id: "stx-" + Math.random().toString(36).slice(2, 10),
      created_at: new Date().toISOString(),
      ...row,
    };
    list.push(tx);
    writeLocal(TX_KEY(orgId), list);
    return tx;
  },

  // --------------------------------------------------------------------------
  // Cash counts
  // --------------------------------------------------------------------------
  async saveCashCounts(
    shiftId: string,
    countType: "opening" | "closing",
    counts: Array<{ denomination: number; quantity: number }>,
  ): Promise<void> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const rows = counts
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        organization_id: orgId,
        shift_id: shiftId,
        count_type: countType,
        denomination: c.denomination,
        quantity: c.quantity,
      }));
    if (rows.length === 0) return;
    try {
      const { error } = await supabase.from("cash_counts").insert(rows);
      if (error) throw error;
    } catch {
      const list = readLocal<any[]>(COUNT_KEY(orgId), []);
      for (const r of rows) {
        list.push({
          id: "cc-" + Math.random().toString(36).slice(2, 10),
          ...r,
          total_amount: r.denomination * r.quantity,
          created_at: new Date().toISOString(),
        });
      }
      writeLocal(COUNT_KEY(orgId), list);
    }
  },

  async getCashCounts(shiftId: string, countType?: "opening" | "closing"): Promise<CashCount[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      let q = supabase.from("cash_counts").select("*").eq("shift_id", shiftId);
      if (countType) q = q.eq("count_type", countType);
      const { data, error } = await q;
      if (error) {
        if (this.isTableMissing(error)) {
          let local = readLocal<CashCount[]>(COUNT_KEY(orgId), []).filter((c) => c.shift_id === shiftId);
          if (countType) local = local.filter((c) => c.count_type === countType);
          return local;
        }
        throw error;
      }
      return data || [];
    } catch {
      let local = readLocal<CashCount[]>(COUNT_KEY(orgId), []).filter((c) => c.shift_id === shiftId);
      if (countType) local = local.filter((c) => c.count_type === countType);
      return local;
    }
  },

  // --------------------------------------------------------------------------
  // Shift assignments / staff roster
  // --------------------------------------------------------------------------
  async listShiftAssignments(filters?: {
    from?: string;
    to?: string;
    branchId?: string;
    employeeId?: string;
  }): Promise<ShiftAssignment[]> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    try {
      let q = supabase
        .from("shift_assignments")
        .select("*, employee:employees(id, name, email), branch:branches(id, name)")
        .eq("organization_id", orgId)
        .order("work_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (filters?.from) q = q.gte("work_date", filters.from);
      if (filters?.to) q = q.lte("work_date", filters.to);
      if (filters?.branchId) q = q.eq("branch_id", filters.branchId);
      if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
      const { data, error } = await q;
      if (error) {
        if (this.isTableMissing(error)) return this.listLocalAssignments(orgId, filters);
        throw error;
      }
      return (data || []) as ShiftAssignment[];
    } catch {
      return this.listLocalAssignments(orgId, filters);
    }
  },

  async createShiftAssignment(payload: ShiftAssignmentPayload): Promise<ShiftAssignment> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();
    const canManage =
      (await permissionService.hasPermission("shifts.adjust")) ||
      (await permissionService.hasPermission("staff.update"));
    if (!canManage) throw new Error("Bạn không có quyền phân ca làm việc.");

    const row = {
      organization_id: orgId,
      employee_id: payload.employee_id,
      profile_id: payload.profile_id || null,
      branch_id: payload.branch_id || null,
      title: payload.title || "Ca làm việc",
      work_date: payload.work_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      break_minutes: payload.break_minutes || 0,
      status: payload.status || "scheduled",
      note: payload.note || null,
      created_by: userId === "00000000-0000-0000-0000-000000000000" ? null : userId,
    };

    try {
      const { data, error } = await supabase.from("shift_assignments").insert([row]).select().single();
      if (error) {
        if (this.isTableMissing(error)) return this.createLocalAssignment(orgId, row);
        throw error;
      }
      await permissionService.createAuditLog(orgId, userId, "shifts.assignment_create", {
        assignment_id: data.id,
        employee_id: row.employee_id,
        work_date: row.work_date,
        start_time: row.start_time,
        end_time: row.end_time,
      });
      return data as ShiftAssignment;
    } catch {
      const assignment = this.createLocalAssignment(orgId, row);
      await permissionService.createAuditLog(orgId, userId, "shifts.assignment_create", {
        assignment_id: assignment.id,
        employee_id: row.employee_id,
        work_date: row.work_date,
        local: true,
      });
      return assignment;
    }
  },

  async updateShiftAssignmentStatus(id: string, status: ShiftAssignmentStatus): Promise<void> {
    const supabase = createClient();
    const orgId = await permissionService.getActiveOrgId();
    const userId = await permissionService.getActiveUserId();
    try {
      const { error } = await supabase
        .from("shift_assignments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", orgId);
      if (error) {
        if (!this.isTableMissing(error)) throw error;
        this.updateLocalAssignmentStatus(orgId, id, status);
      }
    } catch {
      this.updateLocalAssignmentStatus(orgId, id, status);
    }
    await permissionService.createAuditLog(orgId, userId, "shifts.assignment_status", { assignment_id: id, status });
  },

  listLocalAssignments(
    orgId: string,
    filters?: { from?: string; to?: string; branchId?: string; employeeId?: string },
  ): ShiftAssignment[] {
    let list = readLocal<ShiftAssignment[]>(ASSIGNMENT_KEY(orgId), []);
    if (filters?.from) list = list.filter((item) => item.work_date >= filters.from!);
    if (filters?.to) list = list.filter((item) => item.work_date <= filters.to!);
    if (filters?.branchId) list = list.filter((item) => item.branch_id === filters.branchId);
    if (filters?.employeeId) list = list.filter((item) => item.employee_id === filters.employeeId);
    return list.sort((a, b) => `${a.work_date} ${a.start_time}`.localeCompare(`${b.work_date} ${b.start_time}`));
  },

  createLocalAssignment(orgId: string, row: any): ShiftAssignment {
    const list = readLocal<ShiftAssignment[]>(ASSIGNMENT_KEY(orgId), []);
    const assignment: ShiftAssignment = {
      ...row,
      id: "assignment-" + Math.random().toString(36).slice(2, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(assignment);
    writeLocal(ASSIGNMENT_KEY(orgId), list);
    return assignment;
  },

  updateLocalAssignmentStatus(orgId: string, id: string, status: ShiftAssignmentStatus): void {
    const list = readLocal<ShiftAssignment[]>(ASSIGNMENT_KEY(orgId), []);
    writeLocal(
      ASSIGNMENT_KEY(orgId),
      list.map((item) => (item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)),
    );
  },

  // --------------------------------------------------------------------------
  // Orders linked to a shift
  // --------------------------------------------------------------------------
  async getShiftOrders(shiftId: string): Promise<any[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, total_amount, payment_method, status, created_at, customer:customers(id, name, phone)",
        )
        .eq("shift_id", shiftId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // Reports
  // --------------------------------------------------------------------------
  async getReportSummary(
    from: string,
    to: string,
    branchId?: string,
  ): Promise<{
    totals: {
      shifts: number;
      cash: number;
      transfer: number;
      vietqr: number;
      card: number;
      momo: number;
      zalopay: number;
      debt: number;
      refund: number;
      expense: number;
      sales: number;
      orders: number;
      cancelled: number;
      cash_difference: number;
    };
    byCashier: Array<{ cashier_id: string; cashier_name: string; shifts: number; sales: number; difference: number }>;
  }> {
    const shifts = await this.listShifts({ from, to, branchId });
    const totals = {
      shifts: shifts.length,
      cash: 0,
      transfer: 0,
      vietqr: 0,
      card: 0,
      momo: 0,
      zalopay: 0,
      debt: 0,
      refund: 0,
      expense: 0,
      sales: 0,
      orders: 0,
      cancelled: 0,
      cash_difference: 0,
    };
    const byCashierMap = new Map<
      string,
      { cashier_id: string; cashier_name: string; shifts: number; sales: number; difference: number }
    >();

    for (const s of shifts) {
      totals.cash += Number(s.cash_sales_amount || 0);
      totals.transfer += Number(s.bank_transfer_amount || 0);
      totals.vietqr += Number(s.vietqr_amount || 0);
      totals.card += Number(s.card_amount || 0);
      totals.momo += Number(s.momo_amount || 0);
      totals.zalopay += Number(s.zalopay_amount || 0);
      totals.debt += Number(s.debt_amount || 0);
      totals.refund += Number(s.refund_amount || 0);
      totals.expense += Number(s.expense_amount || 0);
      totals.sales += Number(s.total_sales_amount || 0);
      totals.orders += Number(s.total_orders || 0);
      totals.cancelled += Number(s.cancelled_orders || 0);
      totals.cash_difference += Number(s.cash_difference || 0);

      const key = s.cashier_id;
      const name = s.cashier?.full_name || s.cashier?.email || "—";
      const entry = byCashierMap.get(key) || {
        cashier_id: key,
        cashier_name: name,
        shifts: 0,
        sales: 0,
        difference: 0,
      };
      entry.shifts += 1;
      entry.sales += Number(s.total_sales_amount || 0);
      entry.difference += Number(s.cash_difference || 0);
      byCashierMap.set(key, entry);
    }

    return { totals, byCashier: Array.from(byCashierMap.values()) };
  },
};
