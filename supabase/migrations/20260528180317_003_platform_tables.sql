/*
  # Add Full Platform Tables

  1. New Tables
    - `attribute_options`: Options for select/multiselect attributes
    - `tasks`: Work assignment tracking
    - `reviews`: QA review workflow
    - `review_comments`: Feedback on annotations
    - `team_members`: Project team membership

  2. Existing Tables Altered
    - `projects`: Add project_type, annotation_mode, priority, due_date, frame_count columns
    - `annotations`: Add track_id, object_id, occlusion, truncation, frame_index, z_position columns
    - `annotation_classes`: Add parent_id, sort_order, is_active columns
    - `annotation_saves`: Add checkpoint save_type option

  3. Security
    - RLS enabled on all new tables
    - Team membership-based access policies
*/

-- Add columns to existing projects table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
    ALTER TABLE projects ADD COLUMN project_type text NOT NULL DEFAULT '2d' CHECK (project_type IN ('2d', '3d', '2d+3d'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'annotation_mode') THEN
    ALTER TABLE projects ADD COLUMN annotation_mode text NOT NULL DEFAULT '2d' CHECK (annotation_mode IN ('2d', '3d', 'hybrid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
    ALTER TABLE projects ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'due_date') THEN
    ALTER TABLE projects ADD COLUMN due_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'frame_count') THEN
    ALTER TABLE projects ADD COLUMN frame_count integer DEFAULT 0;
  END IF;
END $$;

-- Add columns to existing annotations table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'track_id') THEN
    ALTER TABLE annotations ADD COLUMN track_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'object_id') THEN
    ALTER TABLE annotations ADD COLUMN object_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'occlusion') THEN
    ALTER TABLE annotations ADD COLUMN occlusion text DEFAULT 'none' CHECK (occlusion IN ('none', 'partial', 'heavy', 'full'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'truncation') THEN
    ALTER TABLE annotations ADD COLUMN truncation boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'frame_index') THEN
    ALTER TABLE annotations ADD COLUMN frame_index integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'z_position') THEN
    ALTER TABLE annotations ADD COLUMN z_position numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'class_id') THEN
    ALTER TABLE annotations ADD COLUMN class_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotations' AND column_name = 'task_id') THEN
    ALTER TABLE annotations ADD COLUMN task_id uuid;
  END IF;
END $$;

-- Add 3D annotation types to the check constraint
ALTER TABLE annotations DROP CONSTRAINT IF EXISTS annotations_type_check;
ALTER TABLE annotations ADD CONSTRAINT annotations_type_check CHECK (type IN (
  'rectangle', 'circle', 'polygon', 'polyline', 'text', 'arrow',
  'ellipse', 'freehand', 'point', 'line', 'curve', 'measurement',
  'bounding-box', 'keypoints', 'cuboid', 'cuboid-3d', 'segmentation',
  '3d-cuboid', 'point-cloud-segmentation', '3d-tracking', 'bev-annotation',
  'lane-annotation', 'point-classification', 'sensor-fusion'
));

-- Add columns to annotation_classes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotation_classes' AND column_name = 'parent_id') THEN
    ALTER TABLE annotation_classes ADD COLUMN parent_id uuid REFERENCES annotation_classes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotation_classes' AND column_name = 'sort_order') THEN
    ALTER TABLE annotation_classes ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'annotation_classes' AND column_name = 'is_active') THEN
    ALTER TABLE annotation_classes ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update annotation_saves save_type constraint
ALTER TABLE annotation_saves DROP CONSTRAINT IF EXISTS annotation_saves_save_type_check;
ALTER TABLE annotation_saves ADD CONSTRAINT annotation_saves_save_type_check CHECK (save_type IN ('auto', 'manual', 'checkpoint'));

-- Create attribute_options table
CREATE TABLE IF NOT EXISTS attribute_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES class_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  sort_order integer DEFAULT 0
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  task_type text DEFAULT 'annotation' CHECK (task_type IN ('annotation', 'review', 'correction')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'skipped')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  frame_range text,
  progress numeric DEFAULT 0,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  annotation_id uuid NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create review_comments table
CREATE TABLE IF NOT EXISTS review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general', 'geometry', 'attribute', 'missing', 'duplicate', 'mislabel')),
  position jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'annotator' CHECK (role IN ('owner', 'admin', 'reviewer', 'annotator', 'viewer')),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(project_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Attribute options policies
CREATE POLICY "Team can view options" ON attribute_options FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM class_attributes JOIN annotation_classes ON annotation_classes.id = class_attributes.class_id JOIN projects ON projects.id = annotation_classes.project_id WHERE class_attributes.id = attribute_options.attribute_id AND (projects.user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = projects.id AND user_id = auth.uid()))));

CREATE POLICY "Admins can manage options" ON attribute_options FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM class_attributes JOIN annotation_classes ON annotation_classes.id = class_attributes.class_id JOIN projects ON projects.id = annotation_classes.project_id WHERE class_attributes.id = attribute_options.attribute_id AND (projects.user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'admin')))));

-- Tasks policies
CREATE POLICY "Team can view tasks" ON tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE id = tasks.project_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = tasks.project_id AND user_id = auth.uid()))));

CREATE POLICY "Admins can manage tasks" ON tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = project_id AND user_id = auth.uid() AND role IN ('owner', 'admin')))));

CREATE POLICY "Assignee can update tasks" ON tasks FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid() OR EXISTS (SELECT 1 FROM projects WHERE id = tasks.project_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM team_members WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "Admins can delete tasks" ON tasks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE id = tasks.project_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role IN ('owner', 'admin')))));

-- Reviews policies
CREATE POLICY "Team can view reviews" ON reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE id = reviews.project_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = reviews.project_id AND user_id = auth.uid()))));

CREATE POLICY "Reviewers can create reviews" ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND EXISTS (SELECT 1 FROM team_members WHERE project_id = reviews.project_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'reviewer')));

CREATE POLICY "Reviewers can update reviews" ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id);

-- Review comments policies
CREATE POLICY "Team can view comments" ON review_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews JOIN projects ON projects.id = reviews.project_id WHERE reviews.id = review_comments.review_id AND (projects.user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = projects.id AND user_id = auth.uid()))));

CREATE POLICY "Team can create comments" ON review_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM reviews JOIN projects ON projects.id = reviews.project_id WHERE reviews.id = review_comments.review_id AND (projects.user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE project_id = projects.id AND user_id = auth.uid()))));

-- Team members policies
CREATE POLICY "Team can view members" ON team_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE id = team_members.project_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.project_id = team_members.project_id AND tm.user_id = auth.uid()))));

CREATE POLICY "Owners can add members" ON team_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Owners can remove members" ON team_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE id = team_members.project_id AND user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_annotation ON reviews(annotation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_annotations_frame ON annotations(frame_index);
CREATE INDEX IF NOT EXISTS idx_annotations_class ON annotations(class_id);