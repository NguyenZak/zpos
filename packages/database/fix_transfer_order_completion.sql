-- ZPOS transfer payment completion fix
-- Keep order.status aligned when a VietQR / bank transfer is confirmed.

update orders
set status = 'completed'
where payment_status = 'paid'
  and status not in ('completed', 'cancelled');

create or replace function record_payment_webhook(
  p_bank_account_id uuid,
  p_webhook_secret text,
  p_provider text,
  p_external_id text,
  p_amount numeric,
  p_reference_code text,
  p_description text,
  p_transfer_type text,
  p_counterparty_name text,
  p_counterparty_account text,
  p_raw_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_expected_secret text;
  v_existing_tx_id uuid;
  v_tx_id uuid;
  v_order record;
  v_now timestamp with time zone := now();
  v_status text := 'unmatched';
begin
  select tenant_id, webhook_secret
    into v_tenant_id, v_expected_secret
  from bank_accounts
  where id = p_bank_account_id;

  if v_tenant_id is null then
    return jsonb_build_object('ok', false, 'error', 'bank_account_not_found');
  end if;

  if v_expected_secret is not null
     and v_expected_secret <> ''
     and v_expected_secret <> p_webhook_secret then
    return jsonb_build_object('ok', false, 'error', 'invalid_secret');
  end if;

  if p_external_id is not null and p_external_id <> '' then
    select id into v_existing_tx_id
    from payment_transactions
    where tenant_id = v_tenant_id
      and provider = p_provider
      and external_id = p_external_id
    limit 1;

    if v_existing_tx_id is not null then
      return jsonb_build_object('ok', true, 'duplicate', true, 'tx_id', v_existing_tx_id);
    end if;
  end if;

  if p_reference_code is not null and p_reference_code <> '' then
    select * into v_order
    from orders
    where organization_id = v_tenant_id
      and payment_reference = p_reference_code
      and payment_status = 'pending'
    order by created_at desc
    limit 1;
  end if;

  if v_order.id is null and p_description is not null then
    select o.* into v_order
    from orders o
    where o.organization_id = v_tenant_id
      and o.payment_status = 'pending'
      and o.payment_reference is not null
      and position(o.payment_reference in upper(p_description)) > 0
    order by o.created_at desc
    limit 1;
  end if;

  if v_order.id is not null then v_status := 'matched'; end if;

  insert into payment_transactions(
    tenant_id, bank_account_id, order_id, provider, external_id,
    reference_code, amount, transfer_type, counterparty_name,
    counterparty_account, description, status, matched_at, raw_payload
  ) values (
    v_tenant_id, p_bank_account_id, v_order.id, p_provider, p_external_id,
    p_reference_code, p_amount,
    coalesce(p_transfer_type, 'in'),
    p_counterparty_name, p_counterparty_account, p_description,
    v_status,
    case when v_order.id is not null then v_now else null end,
    coalesce(p_raw_payload, '{}'::jsonb)
  )
  returning id into v_tx_id;

  if v_order.id is not null then
    update orders
       set payment_status = 'paid',
           payment_confirmed_at = v_now,
           payment_amount_received = coalesce(payment_amount_received, 0) + p_amount,
           status = 'completed'
     where id = v_order.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'tx_id', v_tx_id,
    'matched', v_order.id is not null,
    'order_id', v_order.id
  );
end $$;

grant execute on function record_payment_webhook(
  uuid, text, text, text, numeric, text, text, text, text, text, jsonb
) to anon, authenticated;
