-- Harden analytics/payment access and make event images private.

update storage.buckets
set public = false
where id = 'event-images';

revoke all on public.event_payment_summary from anon, authenticated;

drop view if exists public.event_payment_summary;

create view public.event_payment_summary
with (security_invoker = true) as
select
  ef.event_id,
  ef.total_amount,
  coalesce(sum(ep.amount), 0)::numeric(12,2) as total_paid,
  (ef.total_amount - coalesce(sum(ep.amount), 0))::numeric(12,2) as balance,
  case
    when coalesce(sum(ep.amount), 0) = 0 then 'unpaid'::public.payment_status
    when coalesce(sum(ep.amount), 0) >= ef.total_amount then 'paid'::public.payment_status
    else 'partial'::public.payment_status
  end as payment_status
from public.event_financials ef
left join public.event_payments ep on ep.event_id = ef.event_id
group by ef.event_id, ef.total_amount;

grant select on public.event_payment_summary to authenticated;