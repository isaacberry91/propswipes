-- Add RLS policy for admins to view all apple_id_mappings
CREATE POLICY "Admins can view all apple id mappings" 
ON apple_id_mappings 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));