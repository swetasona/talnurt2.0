-- Populate the company field with company names for existing users
UPDATE users 
SET company = companies.name
FROM companies
WHERE users.company_id = companies.id
AND users.company IS NULL; 