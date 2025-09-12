-- Function to automatically create profile and plan after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  
  -- Create default plan
  INSERT INTO public.user_plans (user_id, plan)
  VALUES (new.id, 'free');
  
  RETURN new;
END;
$$;

-- Trigger that fires after new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();