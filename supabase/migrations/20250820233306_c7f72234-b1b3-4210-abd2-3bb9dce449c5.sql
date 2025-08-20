-- Add deleted_at to matches table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.matches ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_at to messages table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create reports table for user reporting
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL, -- Profile ID of person making the report
    reported_user_id UUID NOT NULL, -- Profile ID of person being reported
    match_id UUID, -- Optional: specific match being reported
    report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate_content', 'harassment', 'fake_profile', 'spam', 'not_real_estate', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    admin_notes TEXT,
    reviewed_by UUID, -- Profile ID of admin who reviewed
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create blocked_users table for blocking functionality
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL, -- Profile ID of person doing the blocking
    blocked_id UUID NOT NULL, -- Profile ID of person being blocked
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on new tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports table
CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (reporter_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (reporter_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all reports" 
ON public.reports 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));

CREATE POLICY "Admins can update reports" 
ON public.reports 
FOR UPDATE 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));

-- RLS Policies for blocked_users table
CREATE POLICY "Users can create blocks" 
ON public.blocked_users 
FOR INSERT 
WITH CHECK (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their blocks" 
ON public.blocked_users 
FOR SELECT 
USING (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their blocks" 
ON public.blocked_users 
FOR DELETE 
USING (blocker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all blocks" 
ON public.blocked_users 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));

-- Update matches table RLS to exclude deleted matches
CREATE POLICY "Users can soft delete their matches" 
ON public.matches 
FOR UPDATE 
USING (((auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = matches.buyer_id))) OR (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = matches.seller_id)))))
WITH CHECK (((auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = matches.buyer_id))) OR (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE (profiles.id = matches.seller_id)))));

-- Update messages table RLS to exclude deleted messages
CREATE POLICY "Users can soft delete messages from their matches" 
ON public.messages 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM matches WHERE ((matches.id = messages.match_id) AND ((matches.buyer_id = get_user_profile_id_for_auth_user()) OR (matches.seller_id = get_user_profile_id_for_auth_user())))))
WITH CHECK (EXISTS ( SELECT 1 FROM matches WHERE ((matches.id = messages.match_id) AND ((matches.buyer_id = get_user_profile_id_for_auth_user()) OR (matches.seller_id = get_user_profile_id_for_auth_user())))));

-- Create updated timestamp triggers
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(profile_a uuid, profile_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = profile_a AND blocked_id = profile_b) 
       OR (blocker_id = profile_b AND blocked_id = profile_a)
  );
$$;