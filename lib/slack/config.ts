// Slack OAuth configuration
export const SLACK_CONFIG = {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  redirectUri: process.env.SLACK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/slack/callback`,
  scopes: ["channels:read", "groups:read", "chat:write", "chat:write.public", "users:read", "team:read"].join(","),
  authUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  refreshUrl: "https://slack.com/api/oauth.v2.access",
}

export const SLACK_BOT_CONFIG = {
  botToken: process.env.SLACK_BOT_TOKEN,
  // Bot tokens provide additional capabilities like posting as the app
  isConfigured: () => !!process.env.SLACK_BOT_TOKEN,
}

export function generateSlackAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: SLACK_CONFIG.clientId,
    scope: SLACK_CONFIG.scopes,
    redirect_uri: SLACK_CONFIG.redirectUri,
    response_type: "code",
    ...(state && { state }),
  })

  return `${SLACK_CONFIG.authUrl}?${params.toString()}`
}
