-- Create comparisons table
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, slug)
);

-- Create contenders table
CREATE TABLE IF NOT EXISTS contenders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE contenders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comparisons
-- Users can only see their own comparisons
CREATE POLICY "Users can view own comparisons" ON comparisons
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own comparisons
CREATE POLICY "Users can create own comparisons" ON comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own comparisons
CREATE POLICY "Users can update own comparisons" ON comparisons
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own comparisons
CREATE POLICY "Users can delete own comparisons" ON comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contenders
-- Users can only see contenders for their own comparisons
CREATE POLICY "Users can view contenders of own comparisons" ON contenders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE comparisons.id = contenders.comparison_id 
      AND comparisons.user_id = auth.uid()
    )
  );

-- Users can only insert contenders for their own comparisons
CREATE POLICY "Users can create contenders for own comparisons" ON contenders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE comparisons.id = contenders.comparison_id 
      AND comparisons.user_id = auth.uid()
    )
  );

-- Users can only update contenders for their own comparisons
CREATE POLICY "Users can update contenders of own comparisons" ON contenders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE comparisons.id = contenders.comparison_id 
      AND comparisons.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE comparisons.id = contenders.comparison_id 
      AND comparisons.user_id = auth.uid()
    )
  );

-- Users can only delete contenders for their own comparisons
CREATE POLICY "Users can delete contenders of own comparisons" ON contenders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM comparisons 
      WHERE comparisons.id = contenders.comparison_id 
      AND comparisons.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_comparisons_user_id ON comparisons(user_id);
CREATE INDEX idx_comparisons_slug ON comparisons(slug);
CREATE INDEX idx_contenders_comparison_id ON contenders(comparison_id);