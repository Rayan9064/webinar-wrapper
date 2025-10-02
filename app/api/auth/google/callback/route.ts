import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Handle OAuth2 callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code received' },
        { status: 400 }
      );
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback'
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Return success page with tokens (in production, store these securely)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { background: #e8f5e8; padding: 20px; border-radius: 8px; border: 1px solid #4caf50; }
            .token { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; word-break: break-all; }
            .instructions { background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Google OAuth Authorization Successful!</h2>
            <p>Your Google account has been successfully authorized for calendar access.</p>
          </div>
          
          <div class="instructions">
            <h3>📋 Next Steps:</h3>
            <ol>
              <li>Copy the refresh token below</li>
              <li>Add it to your <code>.env.local</code> file</li>
              <li>Test Google Meet scheduling</li>
            </ol>
          </div>

          <h3>🔑 Refresh Token:</h3>
          <div class="token">
            GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'No refresh token - try again with prompt=consent'}
          </div>

          <h3>📄 Add to .env.local:</h3>
          <div class="token">
            # Google OAuth Configuration<br>
            GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}<br>
            GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}<br>
            GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'REFRESH_TOKEN_HERE'}
          </div>

          <p><a href="http://localhost:3000">← Back to Webinar Wrapper</a></p>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to process OAuth callback' },
      { status: 500 }
    );
  }
}
