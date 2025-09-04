-- Create table for storing Slack workspace connections
CREATE TABLE IF NOT EXISTS public.slack_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Enable Row Level Security
ALTER TABLE public.slack_workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for slack_workspaces
CREATE POLICY "Users can view their own workspace connections" 
  ON public.slack_workspaces FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspace connections" 
  ON public.slack_workspaces FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspace connections" 
  ON public.slack_workspaces FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspace connections" 
  ON public.slack_workspaces FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_user_id ON public.slack_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_workspace_id ON public.slack_workspaces(workspace_id);
