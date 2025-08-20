-- Fix the get_user_profile_id_for_auth_user function to handle edge cases better
CREATE OR REPLACE FUNCTION public.get_user_profile_id_for_auth_user()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$function$;