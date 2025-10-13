/*
  # Add Category Field to Workflow Statuses

  ## Overview
  This migration adds a category field to the workflow_statuses table to support
  the three-category status system similar to Jira's workflow categorization.

  ## Changes
  1. Add category column to workflow_statuses table
    - Type: text
    - Values: 'todo', 'inprogress', 'done'
    - Default: 'todo'
    - Not null constraint
    - Check constraint to enforce only valid values

  2. Update existing records
    - Set category based on status names (best-effort matching)
    - Fallback to 'todo' if no match found

  ## Notes
  - Category is locked after creation (enforced at application level)
  - Default colors are set based on category at application level:
    - todo: #6b7280 (gray)
    - inprogress: #3b82f6 (blue)
    - done: #10b981 (green)
*/

-- Add category column to workflow_statuses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_statuses' AND column_name = 'category'
  ) THEN
    ALTER TABLE workflow_statuses 
    ADD COLUMN category text DEFAULT 'todo' NOT NULL;
  END IF;
END $$;

-- Add check constraint to enforce valid category values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'workflow_statuses' AND constraint_name = 'workflow_statuses_category_check'
  ) THEN
    ALTER TABLE workflow_statuses
    ADD CONSTRAINT workflow_statuses_category_check 
    CHECK (category IN ('todo', 'inprogress', 'done'));
  END IF;
END $$;

-- Update existing records based on status names (best-effort matching)
UPDATE workflow_statuses
SET category = CASE
  WHEN LOWER(status_name) LIKE '%progress%' OR LOWER(status_name) LIKE '%doing%' OR LOWER(status_name) LIKE '%active%' THEN 'inprogress'
  WHEN LOWER(status_name) LIKE '%done%' OR LOWER(status_name) LIKE '%complete%' OR LOWER(status_name) LIKE '%finish%' OR LOWER(status_name) LIKE '%closed%' OR is_final = true THEN 'done'
  ELSE 'todo'
END
WHERE category = 'todo';

-- Create index on category for potential filtering queries
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_category ON workflow_statuses(category);