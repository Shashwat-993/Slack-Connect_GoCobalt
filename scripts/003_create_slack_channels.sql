-- Create table for caching Slack channel information
CREATE TABLE IF NOT EXISTS public.slack_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.slack_workspaces(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, channel_id)
);

-- Enable Row Level Security
ALTER TABLE public.slack_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for slack_channels (users can only see channels from their workspaces)
CREATE POLICY "Users can view channels from their workspaces" 
  ON public.slack_channels FOR SELECT 
  USING (
    workspace_id IN (
      SELECT id FROM public.slack_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert channels for their workspaces" 
  ON public.slack_channels FOR INSERT 
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.slack_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update channels from their workspaces" 
  ON public.slack_channels FOR UPDATE 
  USING (
    workspace_id IN (
      SELECT id FROM public.slack_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete channels from their workspaces" 
  ON public.slack_channels FOR DELETE 
  USING (
    workspace_id IN (
      SELECT id FROM public.slack_workspaces WHERE user_id = auth.uid()
    )
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_slack_channels_workspace_id ON public.slack_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_channel_id ON public.slack_channels(channel_id);
