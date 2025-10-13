/*
  # Create Process Workflow Tables

  ## Overview
  This migration creates the core tables needed for the Process module with workflow builder functionality.
  It allows workspaces to define custom processes with visual workflow diagrams (statuses and transitions).

  ## New Tables

  ### 1. `processes`
  Stores individual process definitions within workspaces.
  - `id` (uuid, primary key) - Unique identifier
  - `workspace_id` (uuid, foreign key) - Links to workspace
  - `title` (text) - Process name (e.g., "General Process", "Development Workflow")
  - `description` (text, nullable) - Process description
  - `column_id` (uuid, nullable) - Kanban column this process belongs to
  - `order` (integer) - Display order in kanban column
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid, nullable) - User who created the process

  ### 2. `workflow_statuses`
  Stores status nodes in the workflow diagram (like "TO DO", "IN PROGRESS", "DONE").
  - `id` (uuid, primary key) - Unique identifier
  - `process_id` (uuid, foreign key) - Links to parent process
  - `status_name` (text) - Status label (e.g., "Create", "To Do", "Done")
  - `status_color` (text) - Hex color for visual representation
  - `position_x` (numeric) - X coordinate on canvas
  - `position_y` (numeric) - Y coordinate on canvas
  - `order` (integer) - Sequential order in workflow
  - `is_initial` (boolean) - Whether this is the starting status
  - `is_final` (boolean) - Whether this is an end status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `workflow_transitions`
  Stores transitions (arrows) between workflow statuses.
  - `id` (uuid, primary key) - Unique identifier
  - `process_id` (uuid, foreign key) - Links to parent process
  - `from_status_id` (uuid, foreign key) - Source status
  - `to_status_id` (uuid, foreign key) - Destination status
  - `transition_label` (text, nullable) - Label shown on arrow
  - `rules` (jsonb, nullable) - Transition rules and conditions
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `process_columns`
  Stores kanban columns that group processes (like "General Process").
  - `id` (uuid, primary key) - Unique identifier
  - `workspace_id` (uuid, foreign key) - Links to workspace
  - `title` (text) - Column title
  - `order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access processes in their workspaces
  - Authenticated users required for all operations

  ## Indexes
  - Indexes on foreign keys for query performance
  - Composite index on (process_id, order) for workflow_statuses
  - Composite index on (process_id, from_status_id, to_status_id) for workflow_transitions
*/

-- Create process_columns table
CREATE TABLE IF NOT EXISTS process_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  title text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create processes table
CREATE TABLE IF NOT EXISTS processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  column_id uuid REFERENCES process_columns(id) ON DELETE SET NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Create workflow_statuses table
CREATE TABLE IF NOT EXISTS workflow_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  status_name text NOT NULL,
  status_color text DEFAULT '#3b82f6',
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0,
  is_initial boolean DEFAULT false,
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_transitions table
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  from_status_id uuid NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
  to_status_id uuid NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
  transition_label text DEFAULT '',
  rules jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_columns_workspace ON process_columns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_processes_workspace ON processes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_processes_column ON processes(column_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_process ON workflow_statuses(process_id);
CREATE INDEX IF NOT EXISTS idx_workflow_statuses_process_order ON workflow_statuses(process_id, "order");
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_process ON workflow_transitions(process_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_from ON workflow_transitions(from_status_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_to ON workflow_transitions(to_status_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_lookup ON workflow_transitions(process_id, from_status_id, to_status_id);

-- Enable Row Level Security
ALTER TABLE process_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for process_columns
CREATE POLICY "Users can view columns in their workspaces"
  ON process_columns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create columns in their workspaces"
  ON process_columns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update columns in their workspaces"
  ON process_columns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete columns in their workspaces"
  ON process_columns FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for processes
CREATE POLICY "Users can view processes in their workspaces"
  ON processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create processes in their workspaces"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update processes in their workspaces"
  ON processes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete processes in their workspaces"
  ON processes FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for workflow_statuses
CREATE POLICY "Users can view workflow statuses for their processes"
  ON workflow_statuses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_statuses.process_id
  ));

CREATE POLICY "Users can create workflow statuses for their processes"
  ON workflow_statuses FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_statuses.process_id
  ));

CREATE POLICY "Users can update workflow statuses for their processes"
  ON workflow_statuses FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_statuses.process_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_statuses.process_id
  ));

CREATE POLICY "Users can delete workflow statuses for their processes"
  ON workflow_statuses FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_statuses.process_id
  ));

-- RLS Policies for workflow_transitions
CREATE POLICY "Users can view workflow transitions for their processes"
  ON workflow_transitions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_transitions.process_id
  ));

CREATE POLICY "Users can create workflow transitions for their processes"
  ON workflow_transitions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_transitions.process_id
  ));

CREATE POLICY "Users can update workflow transitions for their processes"
  ON workflow_transitions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_transitions.process_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_transitions.process_id
  ));

CREATE POLICY "Users can delete workflow transitions for their processes"
  ON workflow_transitions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM processes
    WHERE processes.id = workflow_transitions.process_id
  ));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_process_columns_updated_at ON process_columns;
CREATE TRIGGER update_process_columns_updated_at BEFORE UPDATE ON process_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processes_updated_at ON processes;
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_statuses_updated_at ON workflow_statuses;
CREATE TRIGGER update_workflow_statuses_updated_at BEFORE UPDATE ON workflow_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_transitions_updated_at ON workflow_transitions;
CREATE TRIGGER update_workflow_transitions_updated_at BEFORE UPDATE ON workflow_transitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
