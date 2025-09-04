# Slack Connect

A comprehensive application for connecting Slack workspaces, sending immediate messages, and scheduling messages for future delivery.

## Features

- **Secure Slack OAuth Integration**: Connect multiple Slack workspaces with automatic token refresh
- **Immediate Message Sending**: Send messages instantly to any connected workspace channel
- **Message Scheduling**: Schedule messages for future delivery with precise timing
- **Scheduled Message Management**: View, edit, and cancel scheduled messages
- **Multi-Workspace Support**: Manage multiple Slack workspaces from one dashboard
- **Real-time Updates**: Live updates for message status and scheduling

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Slack OAuth 2.0
- **Deployment**: Vercel (recommended)

## Quick Setup

This repository includes pre-configured Slack app credentials for immediate testing:

1. Clone the repository and run `npm install`
2. Copy `.env.example` to `.env.local` (credentials already included)
3. Set up your Supabase project and add those credentials
4. Run the database scripts and start with `npm run dev`

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. A Slack app with OAuth capabilities (or use the included test app)

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd slack-connect
npm install
\`\`\`

### 2. Slack App Configuration

**Option A: Use Included Test App (Recommended for Testing)**
The repository includes a pre-configured Slack app with these credentials:
- App ID: `A09D4JP4A07`
- Client ID: `9462130751190.9446635146007`
- All necessary tokens are included in `.env.example`

**Option B: Create Your Own Slack App**
1. Go to [Slack API](https://api.slack.com/apps) and create a new app
2. Configure OAuth & Permissions:
   - Add redirect URL: `http://localhost:3000/api/auth/slack/callback`
   - Add scopes: `channels:read`, `groups:read`, `chat:write`, `chat:write.public`, `users:read`, `team:read`
3. Install the app to your workspace to get the Bot User OAuth Token
4. Copy your Client ID, Client Secret, and Bot Token

### 3. Environment Variables

Copy `.env.example` to `.env.local`. The Slack credentials are already configured:

\`\`\`env
# Slack Configuration (Pre-configured for testing)
SLACK_CLIENT_ID=9462130751190.9446635146007
SLACK_CLIENT_SECRET=1f4e82dc40e5e7b4fd482067507a99ae
SLACK_BOT_TOKEN=xoxb-9462130751190-9446647184263-PIiRC4yl5HTqROqDoBAWQouj
SLACK_SIGNING_SECRET=27895efa6a2dd9c83dd5e6f99676a968
SLACK_VERIFICATION_TOKEN=76HcaZx1XGt08heENh5qnonz
SLACK_REDIRECT_URI=http://localhost:3000/api/auth/slack/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### 4. Database Setup

The application includes SQL scripts to set up the required database schema:

1. Run the database migration scripts in order:
   - `scripts/001_create_slack_workspaces.sql`
   - `scripts/002_create_scheduled_messages.sql`
   - `scripts/003_create_slack_channels.sql`
   - `scripts/004_create_functions.sql`

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to start using the application.

## Architectural Overview

### OAuth 2.0 Flow
- Implements secure OAuth 2.0 with PKCE for Slack workspace connections
- Automatic token refresh using refresh tokens stored securely in the database
- Support for multiple workspace connections per user

### Token Management
- Access tokens and refresh tokens stored encrypted in Supabase
- Automatic token refresh before expiration
- Graceful handling of token revocation and re-authentication

### Scheduled Task Handling
- Cron job system using Vercel Cron Jobs (runs every minute)
- Reliable message delivery with retry logic and error handling
- Message status tracking (pending, sent, failed, cancelled)

### Security Features
- Row Level Security (RLS) policies protect user data
- Secure token storage with encryption
- CSRF protection and secure session management
- Input validation and sanitization

## API Endpoints

### Authentication
- `GET /api/auth/slack` - Initiate Slack OAuth flow
- `GET /api/auth/slack/callback` - Handle OAuth callback
- `POST /api/auth/slack/refresh` - Refresh access tokens

### Messages
- `POST /api/messages/send` - Send immediate message
- `POST /api/messages/scheduled` - Schedule message
- `GET /api/messages/scheduled` - Get scheduled messages
- `DELETE /api/messages/scheduled/[id]` - Cancel scheduled message

### Workspaces
- `GET /api/workspaces` - Get connected workspaces
- `GET /api/workspaces/[id]/channels` - Get workspace channels

### Background Jobs
- `POST /api/cron/process-messages` - Process scheduled messages (Vercel Cron)

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update `SLACK_REDIRECT_URI` to your production URL
5. Update Slack app redirect URLs to match production

### Environment Variables for Production

Update these variables for production deployment:
- `NEXT_PUBLIC_APP_URL`: Your production domain
- `SLACK_REDIRECT_URI`: `https://yourdomain.com/api/auth/slack/callback`

## Challenges & Learnings

### OAuth Token Management
**Challenge**: Implementing secure token refresh without user interruption
**Solution**: Built a token manager that proactively refreshes tokens before expiration and handles edge cases like network failures and token revocation.

### Scheduled Message Reliability
**Challenge**: Ensuring messages are sent exactly when scheduled, even during server restarts
**Solution**: Used Vercel Cron Jobs with database-backed scheduling and implemented retry logic with exponential backoff for failed deliveries.

### Multi-Workspace Support
**Challenge**: Managing multiple Slack workspace connections per user
**Solution**: Designed a flexible database schema that supports multiple workspace tokens per user with proper isolation and security.

### Real-time Updates
**Challenge**: Providing live updates for message status and scheduling
**Solution**: Leveraged Supabase real-time subscriptions to push updates to the frontend without polling.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
