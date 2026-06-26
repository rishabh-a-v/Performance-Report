-- Migrate any existing 'draft' job directions to 'active'
UPDATE job_directions SET status = 'active' WHERE status = 'draft';

-- Change the column default so new inserts never land on 'draft'
ALTER TABLE job_directions ALTER COLUMN status SET DEFAULT 'active';
