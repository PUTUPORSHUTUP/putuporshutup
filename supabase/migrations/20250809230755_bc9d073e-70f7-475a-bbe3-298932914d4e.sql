-- Add admin policies to allow management of fraud detection
create policy "admins can manage match results"
on public.match_results for all
to authenticated
using (is_user_admin())
with check (is_user_admin());

create policy "admins can manage fraud flags"
on public.fraud_flags for all
to authenticated
using (is_user_admin())
with check (is_user_admin());

-- Insert policies allow users to create their own match results
create policy "users can insert own match results"
on public.match_results for insert
to authenticated
with check (auth.uid() in (winner, loser));

create policy "users can insert fraud flags"
on public.fraud_flags for insert
to authenticated
with check (true);