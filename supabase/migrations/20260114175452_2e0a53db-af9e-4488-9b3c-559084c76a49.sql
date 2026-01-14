-- Allow clients to update case_matches for their cases (accept/reject)
CREATE POLICY "Clients can update matches for their cases"
ON public.case_matches
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM cases
  WHERE cases.id = case_matches.case_id
  AND cases.user_id = auth.uid()
));

-- Allow users to create consultations for their cases
CREATE POLICY "Users can create consultations for their cases"
ON public.consultations
FOR INSERT
WITH CHECK (auth.uid() = user_id);