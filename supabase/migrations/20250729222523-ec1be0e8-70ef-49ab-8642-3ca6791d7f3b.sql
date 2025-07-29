-- Insert default tier protection rules for fair play
INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'novice'::skill_tier as tier,
  10.00 as max_entry_fee, -- Novices limited to $10 max
  100 as max_rating_difference, -- Small skill gap
  true as protected,
  0 as min_matches_required
FROM games g WHERE g.is_active = true;

INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'amateur'::skill_tier as tier,
  25.00 as max_entry_fee, -- Amateurs limited to $25 max
  150 as max_rating_difference,
  true as protected,
  5 as min_matches_required
FROM games g WHERE g.is_active = true;

INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'intermediate'::skill_tier as tier,
  50.00 as max_entry_fee,
  200 as max_rating_difference,
  false as protected,
  10 as min_matches_required
FROM games g WHERE g.is_active = true;

INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'advanced'::skill_tier as tier,
  100.00 as max_entry_fee,
  250 as max_rating_difference,
  false as protected,
  25 as min_matches_required
FROM games g WHERE g.is_active = true;

INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'expert'::skill_tier as tier,
  500.00 as max_entry_fee,
  300 as max_rating_difference,
  false as protected,
  50 as min_matches_required
FROM games g WHERE g.is_active = true;

INSERT INTO public.tier_protection_rules (game_id, tier, max_entry_fee, max_rating_difference, protected, min_matches_required)
SELECT 
  g.id as game_id,
  'pro'::skill_tier as tier,
  9999.00 as max_entry_fee, -- No limits for pros
  9999 as max_rating_difference,
  false as protected,
  100 as min_matches_required
FROM games g WHERE g.is_active = true;