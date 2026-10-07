-- Sølvposten — kjøres i Supabase SQL Editor.
-- Flytter jury-sjekkene og automatisk juryeringsstart inn i databasen,
-- så de ikke trenger Supabase service-nøkkelen på Vercel.

-- 1) Jurykode: gir tilbake jurymedlemmet hvis koden tilhører innlogget bruker
create or replace function public.validate_jury_code(p_code text)
returns setof public.jury_codes
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.jury_codes
  where code = upper(trim(p_code))
    and email is not null
    and lower(email) = lower(auth.email())
  limit 1;
$$;

revoke execute on function public.validate_jury_code from public, anon;
grant execute on function public.validate_jury_code to authenticated;

-- 2) Poeng: samme regler som før — koden må være din, juryering aktiv, 1–9
create or replace function public.set_jury_score(
  p_submission_id public.scores.submission_id%type,
  p_code text,
  p_score int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jury_id public.jury_codes.id%type;
begin
  if p_score is null or p_score < 1 or p_score > 9 then
    raise exception 'Ugyldig poeng (må være 1–9)';
  end if;

  select id into v_jury_id
  from public.jury_codes
  where code = upper(trim(p_code))
    and email is not null
    and lower(email) = lower(auth.email());
  if v_jury_id is null then
    raise exception 'Denne jurykoden tilhører ikke din konto';
  end if;

  if coalesce((select value from public.settings where key = 'judging_active'), 'false') <> 'true' then
    raise exception 'Juryering er ikke aktiv';
  end if;

  insert into public.scores (submission_id, jury_code_id, score)
  values (p_submission_id, v_jury_id, p_score)
  on conflict (submission_id, jury_code_id) do update set score = excluded.score;
end;
$$;

revoke execute on function public.set_jury_score from public, anon;
grant execute on function public.set_jury_score to authenticated;

-- 3) Automatisk start av juryering 3 dager før fristen (som i Kontrollpanelet).
--    Starter bare én gang per frist, så den ikke slår seg på igjen hvis admin
--    stopper juryeringen. Ny frist = ny automatisk start.
create or replace function public.auto_start_judging()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deadline text;
begin
  select value into v_deadline from public.settings where key = 'competition_deadline';
  if coalesce(v_deadline, '') = '' or current_date < v_deadline::date - 3 then
    return;
  end if;
  if exists (select 1 from public.settings where key = 'auto_judging_started' and value = v_deadline) then
    return;
  end if;

  insert into public.settings (key, value) values ('judging_active', 'true')
  on conflict (key) do update set value = 'true';
  insert into public.settings (key, value) values ('auto_judging_started', v_deadline)
  on conflict (key) do update set value = excluded.value;
end;
$$;

revoke execute on function public.auto_start_judging from public, anon, authenticated;

-- Sjekkes hver dag kl. 08:00 UTC. Krever pg_cron (Database → Extensions → pg_cron).
select cron.schedule('solvposten-auto-judging', '0 8 * * *', 'select public.auto_start_judging()');
