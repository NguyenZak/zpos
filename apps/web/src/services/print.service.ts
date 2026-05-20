import { createClient } from '@/utils/supabase/client';

export type PrintType = 'temp_bill' | 'kitchen_ticket' | 'bar_ticket' | 'final_receipt';

export interface PrintLog {
  id: string;
  organization_id: string;
  order_id: string;
  type: PrintType;
  printer_id?: string;
  printed_by?: string;
  printed_at: string;
}

class PrintService {
  /**
   * Log a print action to the database
   */
  async logPrint(params: {
    orderId: string;
    type: PrintType;
    printerId?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('User not authenticated');

      // Fetch organization_id directly or rely on RLS/triggers if configured.
      // Assuming we get it from a local utility or context. 
      // For now, we will query the user's organization from the 'users' table or just let RLS handle it if it uses default auth.uid() function.
      
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('profile_id', userData.user.id)
        .maybeSingle();
        
      if (!member?.organization_id) throw new Error('Organization not found');

      const { error } = await supabase
        .from('print_logs')
        .insert({
          organization_id: member.organization_id,
          order_id: params.orderId,
          type: params.type,
          printer_id: params.printerId || null,
          printed_by: userData.user.id,
        });

      if (error) {
        console.error('Failed to log print:', error);
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (e: any) {
      console.error('Exception in logPrint:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Get print logs for an order
   */
  async getOrderPrintLogs(orderId: string): Promise<PrintLog[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('print_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('printed_at', { ascending: false });

      if (error) throw error;
      return data as PrintLog[];
    } catch (e) {
      console.error('Failed to fetch print logs:', e);
      return [];
    }
  }
}

export const printService = new PrintService();

