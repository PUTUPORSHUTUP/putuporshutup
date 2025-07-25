-- Add admin override fields to wagers table
ALTER TABLE public.wagers 
ADD COLUMN admin_override boolean DEFAULT false,
ADD COLUMN override_reason text,
ADD COLUMN dispute_status text DEFAULT 'none',
ADD COLUMN admin_actioned_by uuid REFERENCES auth.users(id),
ADD COLUMN last_admin_action_at timestamp with time zone,
ADD COLUMN result_proof_url text,
ADD COLUMN admin_notes text;

-- Add admin override fields to tournament_matches table  
ALTER TABLE public.tournament_matches
ADD COLUMN admin_override boolean DEFAULT false,
ADD COLUMN override_reason text,
ADD COLUMN dispute_status text DEFAULT 'none',
ADD COLUMN admin_actioned_by uuid REFERENCES auth.users(id),
ADD COLUMN last_admin_action_at timestamp with time zone,
ADD COLUMN result_proof_url text,
ADD COLUMN admin_notes text;

-- Add index for admin queries
CREATE INDEX idx_wagers_admin_status ON public.wagers(status, admin_override, dispute_status);
CREATE INDEX idx_tournament_matches_admin_status ON public.tournament_matches(status, admin_override, dispute_status);