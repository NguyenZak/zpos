-- ============================================================================
-- Update shift aggregation to support cash_in and cash_out
-- ============================================================================

create or replace function aggregate_shift(p_shift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_cash numeric := 0;
  v_transfer numeric := 0;
  v_vietqr numeric := 0;
  v_card numeric := 0;
  v_momo numeric := 0;
  v_zalopay numeric := 0;
  v_debt numeric := 0;
  v_refund numeric := 0;
  v_expense numeric := 0;
  v_total numeric := 0;
  v_orders int := 0;
  v_cancelled int := 0;
  v_expected_cash numeric := 0;
  v_cash_in numeric := 0;
  v_cash_out numeric := 0;
begin
  select * into v_shift from shifts where id = p_shift_id;
  if v_shift.id is null then
    return jsonb_build_object('ok', false, 'error', 'shift_not_found');
  end if;

  -- Orders aggregation
  select
    coalesce(sum(total_amount) filter (where status not in ('cancelled', 'refund')), 0),
    coalesce(count(*) filter (where status not in ('cancelled', 'refund')), 0),
    coalesce(count(*) filter (where status = 'cancelled'), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'cash' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method in ('transfer', 'bank_transfer') and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'vietqr' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'card' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'momo' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'zalopay' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where payment_method = 'debt' and status not in ('cancelled', 'refund')), 0),
    coalesce(sum(total_amount) filter (where status = 'refund'), 0)
  into v_total, v_orders, v_cancelled,
       v_cash, v_transfer, v_vietqr, v_card, v_momo, v_zalopay, v_debt, v_refund
  from orders
  where shift_id = p_shift_id;

  -- Shift-level transactions: cash_in/cash_out/expense
  select
    coalesce(sum(amount) filter (where type = 'expense'), 0),
    coalesce(sum(amount) filter (where type = 'cash_in'), 0),
    coalesce(sum(amount) filter (where type = 'cash_out'), 0)
  into v_expense, v_cash_in, v_cash_out
  from shift_transactions
  where shift_id = p_shift_id;

  v_expected_cash := coalesce(v_shift.opening_cash_amount, 0) + v_cash + v_cash_in - v_expense - v_cash_out - v_refund;

  update shifts set
    total_sales_amount = v_total,
    cash_sales_amount = v_cash,
    bank_transfer_amount = v_transfer,
    vietqr_amount = v_vietqr,
    card_amount = v_card,
    momo_amount = v_momo,
    zalopay_amount = v_zalopay,
    debt_amount = v_debt,
    refund_amount = v_refund,
    expense_amount = v_expense,
    total_orders = v_orders,
    cancelled_orders = v_cancelled,
    expected_cash_amount = v_expected_cash
  where id = p_shift_id;

  return jsonb_build_object(
    'ok', true,
    'expected_cash', v_expected_cash,
    'total_sales', v_total,
    'total_orders', v_orders
  );
end $$;

-- RPC for inserting cash transaction
create or replace function register_shift_transaction(
  p_shift_id uuid,
  p_type text,
  p_amount numeric,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_user_id uuid := auth.uid();
  v_tx_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select * into v_shift from shifts where id = p_shift_id;
  if v_shift.id is null then
    return jsonb_build_object('ok', false, 'error', 'shift_not_found');
  end if;
  
  if v_shift.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'shift_not_open');
  end if;

  if p_type not in ('cash_in', 'cash_out') then
    return jsonb_build_object('ok', false, 'error', 'invalid_transaction_type');
  end if;

  insert into shift_transactions(
    organization_id, shift_id, branch_id, type, amount,
    payment_method, note, created_by
  ) values (
    v_shift.organization_id, p_shift_id, v_shift.branch_id, p_type, coalesce(p_amount, 0),
    'cash', p_note, v_user_id
  ) returning id into v_tx_id;

  -- Recompute shift aggregate
  perform aggregate_shift(p_shift_id);

  return jsonb_build_object('ok', true, 'transaction_id', v_tx_id);
end $$;

grant execute on function register_shift_transaction(uuid, text, numeric, text) to authenticated;
