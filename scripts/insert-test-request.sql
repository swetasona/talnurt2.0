-- Insert a test user creation request
-- First, get a company ID and user ID from the database
WITH company AS (
  SELECT id FROM companies LIMIT 1
),
requester AS (
  SELECT id FROM users WHERE role = 'employer' LIMIT 1
)
INSERT INTO user_creation_requests (
  id,
  name,
  email,
  role,
  company_id,
  requested_by,
  status,
  created_at,
  updated_at
)
SELECT
  'test_' || gen_random_uuid(), -- Generate a unique ID with test_ prefix
  'Test User',
  'testuser@example.com',
  'employee',
  company.id,
  requester.id,
  'pending',
  NOW(),
  NOW()
FROM company, requester; 