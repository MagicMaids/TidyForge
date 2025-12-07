-- TidyForge Seed Data
-- Sample data for development and testing

-- Note: This will only insert if tables are empty
-- In production, this script should be run separately or not at all

-- Insert sample company (only if no companies exist)
INSERT INTO companies (id, name, email, phone, subscription_status, subscription_plan)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Demo Cleaning Company',
  'admin@democleaning.com',
  '555-0100',
  'active',
  'professional'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Insert default cleaning checklist
INSERT INTO checklists (id, company_id, name, description, is_default)
SELECT
  '00000000-0000-0000-0000-000000000010'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Standard Airbnb Turnover',
  'Default checklist for Airbnb property turnovers',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM checklists LIMIT 1);

-- Insert default checklist items
INSERT INTO checklist_items (checklist_id, room, task, sort_order)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Clean countertops and backsplash', 1),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Clean and sanitize sink', 2),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Clean stovetop and oven', 3),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Clean microwave inside and out', 4),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Clean refrigerator (remove old food)', 5),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Empty trash and replace liner', 6),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Kitchen', 'Sweep and mop floor', 7),
  
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Clean toilet (bowl, seat, exterior)', 10),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Clean shower/tub and tiles', 11),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Clean sink and countertop', 12),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Clean mirror and fixtures', 13),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Restock toiletries and towels', 14),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Empty trash and replace liner', 15),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bathroom', 'Sweep and mop floor', 16),
  
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bedroom', 'Strip and make bed with fresh linens', 20),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bedroom', 'Dust all surfaces', 21),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bedroom', 'Vacuum carpet or mop floor', 22),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Bedroom', 'Empty trash bins', 23),
  
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Living Room', 'Vacuum all floors and furniture', 30),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Living Room', 'Dust all surfaces and decor', 31),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Living Room', 'Clean windows and mirrors', 32),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'Living Room', 'Arrange furniture and cushions', 33),
  
  ('00000000-0000-0000-0000-000000000010'::UUID, 'General', 'Check and replace light bulbs', 40),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'General', 'Empty all trash bins', 41),
  ('00000000-0000-0000-0000-000000000010'::UUID, 'General', 'Final walkthrough and photos', 42)
) AS checklist_data
WHERE NOT EXISTS (SELECT 1 FROM checklist_items LIMIT 1);
