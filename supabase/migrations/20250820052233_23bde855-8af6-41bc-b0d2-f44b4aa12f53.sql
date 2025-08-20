-- Fix security issue: Function Search Path Mutable
ALTER FUNCTION public.cleanup_expired_2fa_codes() SECURITY DEFINER SET search_path TO 'public';