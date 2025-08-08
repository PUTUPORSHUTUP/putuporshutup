-- Update existing real users to be test accounts with funds for simulation
UPDATE profiles 
SET 
  wallet_balance = 100.00,
  is_test_account = true,
  updated_at = now()
WHERE user_id IN (
  'c6a8a18d-ec2d-4446-ab15-73c45bf93343',
  '12da340a-464a-4987-bac9-c69b546312ed', 
  '6194700d-448b-4f18-8c9e-ab08987de3ca',
  'dc79e64e-364e-467f-871b-45c638f02971',
  '244947fb-30f8-4664-ae27-ec08cecae5c4',
  'b51e56dd-7b61-4fe9-bba0-6ffb2b51b8d0'
);