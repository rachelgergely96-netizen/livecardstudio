-- Run this in Supabase SQL Editor to allow public read access to cards by id.
-- This lets anyone with a share link (/c/:id) view that card without signing in.

-- Option A: Allow anonymous users to SELECT any row in cards (by id; links use UUIDs).
create policy "Public read cards by id"
  on public.cards
  for select
  to anon
  using (true);

-- If you already have a policy that restricts SELECT to the owner, you may need to drop it first
-- or combine with: (auth.uid() = user_id or true) so both owner and anon can read.
-- Example of a combined policy (replace existing select policy if you have one):
-- drop policy if exists "Users can read own cards" on public.cards;
-- create policy "Users read own cards or public by link"
--   on public.cards for select
--   using (auth.uid() = user_id or true);
