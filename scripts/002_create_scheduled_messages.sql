-- Create table for storing scheduled messages
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.slack_workspaces(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  slack_message_ts TEXT, -- Slack's message timestamp for sent messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_messages
CREATE POLICY "Users can view their own scheduled messages" 
  ON public.scheduled_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled messages" 
  ON public.scheduled_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled messages" 
  ON public.scheduled_messages FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled messages" 
  ON public.scheduled_messages FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON public.scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_workspace_id ON public.scheduled_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON public.scheduled_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON public.scheduled_messages(status);

-- Create index for pending messages that need to be sent
CREATE INDEX IF NOT EXISTS idx_pending_messages ON public.scheduled_messages(scheduled_for, status) 
  WHERE status = 'pending';
