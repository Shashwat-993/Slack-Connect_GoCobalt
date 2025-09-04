import { SLACK_CONFIG } from "./config"

export interface SlackTokenResponse {
  ok: boolean
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope: string
  team: {
    id: string
    name: string
  }
  authed_user: {
    id: string
  }
  error?: string
}

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  is_archived: boolean
}

export interface SlackChannelsResponse {
  ok: boolean
  channels: SlackChannel[]
  error?: string
}

export class SlackAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
    const response = await fetch(SLACK_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: SLACK_CONFIG.clientId,
        client_secret: SLACK_CONFIG.clientSecret,
        code,
        redirect_uri: SLACK_CONFIG.redirectUri,
      }),
    })

    return response.json()
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(refreshToken: string): Promise<SlackTokenResponse> {
    const response = await fetch(SLACK_CONFIG.refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: SLACK_CONFIG.clientId,
        client_secret: SLACK_CONFIG.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    return response.json()
  }

  // Get list of channels
  async getChannels(): Promise<SlackChannelsResponse> {
    const response = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel", {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    return response.json()
  }

  // Send a message to a channel
  async sendMessage(channelId: string, text: string): Promise<any> {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    })

    return response.json()
  }

  // Test API connection
  async testAuth(): Promise<any> {
    const response = await fetch("https://slack.com/api/auth.test", {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    return response.json()
  }
}
