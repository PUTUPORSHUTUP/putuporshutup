-- ===============================
-- Use existing admin infrastructure (admin_roles table & is_admin function exist)
-- ===============================

-- ===============================
-- market_wallets (owner: user_id)
-- ===============================
alter table market_wallets enable row level security;

drop policy if exists mw_read_own_or_admin on market_wallets;
create policy mw_read_own_or_admin on market_wallets
for select to authenticated
using (user_id = auth.uid() or is_admin());

drop policy if exists mw_update_own on market_wallets;
create policy mw_update_own on market_wallets
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ===============================
-- market_wallet_transactions (owner: user_id)
-- ===============================
alter table market_wallet_transactions enable row level security;

drop policy if exists mwt_read_own_or_admin on market_wallet_transactions;
create policy mwt_read_own_or_admin on market_wallet_transactions
for select to authenticated
using (user_id = auth.uid() or is_admin());

drop policy if exists mwt_no_user_write on market_wallet_transactions;
create policy mwt_no_user_write on market_wallet_transactions
for insert to authenticated
with check (false);

-- ===============================
-- market_payouts (owner: winner_id)
-- ===============================
alter table market_payouts enable row level security;

drop policy if exists mp_read_own_or_admin on market_payouts;
create policy mp_read_own_or_admin on market_payouts
for select to authenticated
using (winner_id = auth.uid() or is_admin());

drop policy if exists mp_no_user_write on market_payouts;
create policy mp_no_user_write on market_payouts
for insert to authenticated
with check (false);

drop policy if exists mp_no_user_update on market_payouts;
create policy mp_no_user_update on market_payouts
for update to authenticated
using (false);

-- ===============================
-- market_matches (participants: player_a, player_b)
-- ===============================
alter table market_matches enable row level security;

drop policy if exists mm_read_participant_or_admin on market_matches;
create policy mm_read_participant_or_admin on market_matches
for select to authenticated
using (player_a = auth.uid() or player_b = auth.uid() or is_admin());

drop policy if exists mm_no_user_write on market_matches;
create policy mm_no_user_write on market_matches
for insert to authenticated
with check (false);

drop policy if exists mm_no_user_update on market_matches;
create policy mm_no_user_update on market_matches
for update to authenticated
using (false);

-- ===============================
-- market_match_results (owner: user_id; also visible to match participants)
-- ===============================
alter table market_match_results enable row level security;

drop policy if exists mmr_read_self_or_participant_or_admin on market_match_results;
create policy mmr_read_self_or_participant_or_admin on market_match_results
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from market_matches m
    where m.id = market_match_results.match_id
      and (m.player_a = auth.uid() or m.player_b = auth.uid())
  )
  or is_admin()
);

drop policy if exists mmr_no_user_write on market_match_results;
create policy mmr_no_user_write on market_match_results
for insert to authenticated
with check (false);

drop policy if exists mmr_no_user_update on market_match_results;
create policy mmr_no_user_update on market_match_results
for update to authenticated
using (false);

-- ===============================
-- market_queue (owner: user_id)
-- ===============================
alter table market_queue enable row level security;

drop policy if exists mq_read_own_or_admin on market_queue;
create policy mq_read_own_or_admin on market_queue
for select to authenticated
using (user_id = auth.uid() or is_admin());

drop policy if exists mq_insert_self on market_queue;
create policy mq_insert_self on market_queue
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists mq_update_own_waiting on market_queue;
create policy mq_update_own_waiting on market_queue
for update to authenticated
using (user_id = auth.uid() and status = 'waiting')
with check (user_id = auth.uid() and status = 'waiting');

drop policy if exists mq_delete_own_waiting on market_queue;
create policy mq_delete_own_waiting on market_queue
for delete to authenticated
using (user_id = auth.uid() and status = 'waiting');

-- ===============================
-- otp_verifications (sensitive - service_role only)
-- ===============================
alter table otp_verifications enable row level security;

drop policy if exists otp_deny_user_select on otp_verifications;
create policy otp_deny_user_select on otp_verifications
for select to authenticated
using (false);

drop policy if exists otp_deny_user_write on otp_verifications;
create policy otp_deny_user_write on otp_verifications
for insert to authenticated
with check (false);

drop policy if exists otp_deny_user_update on otp_verifications;
create policy otp_deny_user_update on otp_verifications
for update to authenticated
using (false);

drop policy if exists otp_deny_user_delete on otp_verifications;
create policy otp_deny_user_delete on otp_verifications
for delete to authenticated
using (false);

-- ===============================
-- security_events (owner: user_id, nullable for anon)
-- ===============================
alter table security_events enable row level security;

drop policy if exists se_read_own_or_admin on security_events;
create policy se_read_own_or_admin on security_events
for select to authenticated
using ((user_id = auth.uid()) or is_admin());

drop policy if exists se_insert_rules on security_events;
create policy se_insert_rules on security_events
for insert to anon, authenticated
with check (
  (current_setting('request.jwt.claims', true) is null and user_id is null)  -- anon (no JWT)
  or (auth.uid() is not null and user_id = auth.uid())                       -- logged-in
);

drop policy if exists se_no_user_update on security_events;
create policy se_no_user_update on security_events
for update to authenticated
using (false);

drop policy if exists se_no_user_delete on security_events;
create policy se_no_user_delete on security_events
for delete to authenticated
using (false);

-- ===============================
-- site_visits (owner: user_id nullable; anon allowed)
-- ===============================
alter table site_visits enable row level security;

drop policy if exists sv_read_own_or_admin on site_visits;
create policy sv_read_own_or_admin on site_visits
for select to authenticated
using ((user_id = auth.uid()) or is_admin());

drop policy if exists sv_insert_rules on site_visits;
create policy sv_insert_rules on site_visits
for insert to anon, authenticated
with check (
  (auth.uid() is null and user_id is null)      -- anon visit
  or (auth.uid() is not null and user_id = auth.uid())
);

drop policy if exists sv_no_user_update on site_visits;
create policy sv_no_user_update on site_visits
for update to authenticated
using (false);

drop policy if exists sv_no_user_delete on site_visits;
create policy sv_no_user_delete on site_visits
for delete to authenticated
using (false);