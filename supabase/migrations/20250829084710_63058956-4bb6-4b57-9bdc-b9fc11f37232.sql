-- Ensure single subscription row per user for proper UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unique_user ON public.subscribers(user_id);