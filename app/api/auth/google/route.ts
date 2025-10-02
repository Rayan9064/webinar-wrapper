import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Get OAuth2 authorization URL
export async function GET(request: NextRequest) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback'
    );

    // Generate authorization URL with persistent refresh token
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',     // ← Ensures persistent refresh token
      prompt: 'consent',          // ← Forces consent screen
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    console.log('🔗 Generated auth URL:', authUrl);

    // Redirect to Google's authorization page
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate authorization URL',
      details: error 
    }, { status: 500 });
  }
}
