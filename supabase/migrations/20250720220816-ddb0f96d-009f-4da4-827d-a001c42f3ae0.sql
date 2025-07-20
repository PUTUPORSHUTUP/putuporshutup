-- Create wager result reports table for tracking match results
CREATE TABLE public.wager_result_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wager_id, reported_by)
);

-- Enable Row Level Security
ALTER TABLE public.wager_result_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports for wagers they participate in
CREATE POLICY "view_wager_reports" ON public.wager_result_reports
  FOR SELECT
  USING (
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wagers w 
      WHERE w.id = wager_id AND w.creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.wager_participants wp
      WHERE wp.wager_id = wager_result_reports.wager_id AND wp.user_id = auth.uid()
    )
  );

-- Policy: Users can report results for wagers they participate in
CREATE POLICY "insert_wager_reports" ON public.wager_result_reports
  FOR INSERT
  WITH CHECK (
    reported_by = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM public.wagers w 
        WHERE w.id = wager_id AND w.creator_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.wager_participants wp
        WHERE wp.wager_id = wager_result_reports.wager_id AND wp.user_id = auth.uid()
      )
    )
  );

-- Add index for better performance
CREATE INDEX idx_wager_result_reports_wager_id ON public.wager_result_reports(wager_id);
CREATE INDEX idx_wager_result_reports_winner_id ON public.wager_result_reports(winner_id);