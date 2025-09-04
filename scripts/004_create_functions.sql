-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at timestamps
DROP TRIGGER IF EXISTS update_slack_workspaces_updated_at ON public.slack_workspaces;
CREATE TRIGGER update_slack_workspaces_updated_at 
    BEFORE UPDATE ON public.slack_workspaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_messages_updated_at ON public.scheduled_messages;
CREATE TRIGGER update_scheduled_messages_updated_at 
    BEFORE UPDATE ON public.scheduled_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get pending messages that need to be sent
CREATE OR REPLACE FUNCTION get_pending_messages()
RETURNS TABLE (
  message_id UUID,
  user_id UUID,
  workspace_id UUID,
  access_token TEXT,
  refresh_token TEXT,
  channel_id TEXT,
  message_text TEXT,
  scheduled_for TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id as message_id,
    sm.user_id,
    sm.workspace_id,
    sw.access_token,
    sw.refresh_token,
    sm.channel_id,
    sm.message_text,
    sm.scheduled_for
  FROM public.scheduled_messages sm
  JOIN public.slack_workspaces sw ON sm.workspace_id = sw.id
  WHERE sm.status = 'pending' 
    AND sm.scheduled_for <= NOW()
  ORDER BY sm.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
