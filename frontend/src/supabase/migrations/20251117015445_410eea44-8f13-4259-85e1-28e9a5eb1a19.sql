-- 先删除触发器，然后重新创建函数和触发器
DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();