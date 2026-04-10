-- Allow authenticated users to insert their own payment transactions
CREATE POLICY "Users can create their own transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);