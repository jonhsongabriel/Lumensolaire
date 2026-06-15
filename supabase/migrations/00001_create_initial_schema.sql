-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'engineer', 'technician', 'client');

-- Create site status enum
CREATE TYPE public.site_status AS ENUM ('operational', 'alert', 'offline');

-- Create alert severity enum
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

-- Create alert status enum
CREATE TYPE public.alert_status AS ENUM ('new', 'acknowledged', 'resolved');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'client',
  theme text DEFAULT 'light',
  two_factor_enabled boolean DEFAULT false,
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sites table
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  status public.site_status DEFAULT 'operational',
  system_type text NOT NULL, -- 'hybrid', 'autonomous', 'grid-connected'
  capacity_kw numeric(10, 2),
  installation_date date,
  last_communication timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monitoring_data table for real-time metrics
CREATE TABLE public.monitoring_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  production_kw numeric(10, 3),
  consumption_kw numeric(10, 3),
  battery_level_percent numeric(5, 2),
  battery_voltage numeric(10, 2),
  temperature_celsius numeric(5, 2),
  grid_status text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_monitoring_data_site_timestamp ON public.monitoring_data(site_id, timestamp DESC);

-- Create alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  severity public.alert_severity NOT NULL,
  status public.alert_status DEFAULT 'new',
  title text NOT NULL,
  message text NOT NULL,
  threshold_value numeric(10, 3),
  actual_value numeric(10, 3),
  acknowledged_by uuid REFERENCES public.profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index for alerts
CREATE INDEX idx_alerts_site_status ON public.alerts(site_id, status, created_at DESC);

-- Create audit_logs table (immutable)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  site_id uuid REFERENCES public.sites(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for audit logs
CREATE INDEX idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_site_created ON public.audit_logs(site_id, created_at DESC);

-- Create user_sites association table
CREATE TABLE public.user_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, site_id)
);

-- Create site_configurations table
CREATE TABLE public.site_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  parameter_name text NOT NULL,
  parameter_value text NOT NULL,
  unit text,
  description text,
  min_value numeric(10, 3),
  max_value numeric(10, 3),
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(site_id, parameter_name)
);

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  file_url text,
  generated_by uuid REFERENCES public.profiles(id),
  sent_to text[], -- array of email addresses
  send_status text DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- Create helper function to check if user has access to site
CREATE OR REPLACE FUNCTION public.has_site_access(uid uuid, sid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND (
      p.role = 'admin'::public.user_role
      OR EXISTS (
        SELECT 1 FROM public.user_sites us
        WHERE us.user_id = uid AND us.site_id = sid
      )
    )
  );
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (format: username@miaoda.com)
  extracted_username := split_part(NEW.email, '@', 1);
  
  -- Insert profile with role based on user count
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    extracted_username,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'client'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Sites policies
CREATE POLICY "Admins and engineers can manage sites" ON public.sites
  FOR ALL TO authenticated USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'::public.user_role)
  );

CREATE POLICY "Users can view sites they have access to" ON public.sites
  FOR SELECT TO authenticated USING (has_site_access(auth.uid(), id));

-- Monitoring data policies
CREATE POLICY "Admins and engineers can insert monitoring data" ON public.monitoring_data
  FOR INSERT TO authenticated WITH CHECK (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'::public.user_role)
  );

CREATE POLICY "Users can view monitoring data for accessible sites" ON public.monitoring_data
  FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- Alerts policies
CREATE POLICY "Admins and engineers can manage alerts" ON public.alerts
  FOR ALL TO authenticated USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('engineer'::public.user_role, 'technician'::public.user_role))
  );

CREATE POLICY "Users can view alerts for accessible sites" ON public.alerts
  FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- Audit logs policies (read-only for admins and engineers)
CREATE POLICY "Admins and engineers can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'::public.user_role)
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- User sites policies
CREATE POLICY "Admins can manage user sites" ON public.user_sites
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own site assignments" ON public.user_sites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Site configurations policies
CREATE POLICY "Admins and engineers can manage configurations" ON public.site_configurations
  FOR ALL TO authenticated USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'::public.user_role)
  );

CREATE POLICY "Users can view configurations for accessible sites" ON public.site_configurations
  FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- Reports policies
CREATE POLICY "Admins and engineers can manage reports" ON public.reports
  FOR ALL TO authenticated USING (
    is_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'::public.user_role)
  );

CREATE POLICY "Users can view reports for accessible sites" ON public.reports
  FOR SELECT TO authenticated USING (has_site_access(auth.uid(), site_id));

-- Create public view for user profiles (for display purposes)
CREATE VIEW public.public_profiles AS
  SELECT id, username, role, created_at FROM public.profiles;

-- Enable Realtime for monitoring_data and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;