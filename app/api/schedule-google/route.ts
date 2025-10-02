import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Interface for webinar data
interface WebinarData {
  webinar_name: string;
  date: string;
  time: string;
  presenter_name: string;
  presenter_email: string;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
}

// Get Google OAuth2 client
function getGoogleAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing Google OAuth credentials. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local');
  }

  // Use OAuth2 authentication for personal Google accounts
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
  );

  // For now, we'll use a refresh token approach
  // In production, you'd implement proper OAuth flow
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return oauth2Client;
}

// Create Google Calendar event with Meet link
async function createGoogleMeetEvent(webinar: WebinarData, auth: any) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  // Parse date and time
  const startDateTime = new Date(`${webinar.date}T${webinar.time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour

  const eventResource = {
    summary: webinar.webinar_name,
    description: `📋 Webinar Details:
• Title: ${webinar.webinar_name}
• Presenter: ${webinar.presenter_name} (${webinar.presenter_email})
${webinar.attendee_name ? `• Attendee: ${webinar.attendee_name} (${webinar.attendee_email})` : ''}

🔗 Google Meet link will be generated automatically
📧 Invitations will be sent separately via email system`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC',
    },
    // With OAuth2, we can include attendees
    attendees: [
      { email: webinar.presenter_email, organizer: true },
      ...(webinar.attendee_email ? [{ email: webinar.attendee_email }] : [])
    ],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet' // Must be exactly this for Google Meet
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 10 }, // 10 minutes before
      ],
    },
    visibility: 'private', // Keep event private to service account
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventResource,
      conferenceDataVersion: 1,
      sendUpdates: 'none', // Don't send Google calendar invitations
    });

    return response.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw new Error(`Failed to create Google Meet event: ${error}`);
  }
}

// Helper function to validate webinar data
function validateWebinar(webinar: WebinarData, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!webinar.webinar_name || webinar.webinar_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing webinar name`);
  }
  
  if (!webinar.date || webinar.date.trim() === '') {
    errors.push(`Row ${index + 1}: Missing date`);
  }
  
  if (!webinar.time || webinar.time.trim() === '') {
    errors.push(`Row ${index + 1}: Missing time`);
  }
  
  if (!webinar.presenter_name || webinar.presenter_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter name`);
  }
  
  if (!webinar.presenter_email || webinar.presenter_email.trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter email`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Create Google Meet events
export async function POST(request: NextRequest) {
  try {
    const { webinars } = await request.json();
    const scheduledWebinars = [];
    const validationErrors: string[] = [];

    // Check if we have Google credentials
    const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && 
                                process.env.GOOGLE_CLIENT_SECRET;

    if (!hasGoogleCredentials) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local' },
        { status: 400 }
      );
    }

    // Validate all webinars first
    const validWebinars: WebinarData[] = [];
    webinars.forEach((webinar: WebinarData, index: number) => {
      const validation = validateWebinar(webinar, index);
      if (validation.isValid) {
        validWebinars.push(webinar);
      } else {
        validationErrors.push(...validation.errors);
      }
    });

    if (validWebinars.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid webinars found to schedule',
          validation_errors: validationErrors
        },
        { status: 400 }
      );
    }

    if (validationErrors.length > 0) {
      console.log('⚠️ Validation warnings:', validationErrors);
    }

    console.log(`🔄 Creating REAL Google Meet events for ${validWebinars.length} valid webinars...`);
    
    // Get Google Auth
    const auth = getGoogleAuth();
    
    for (const webinar of validWebinars) {
      try {
        // Create real Google Meet event
        const meetEvent = await createGoogleMeetEvent(webinar, auth);
        
        // Extract Google Meet details
        const meetLink = meetEvent.hangoutLink;
        const conferenceId = meetEvent.conferenceData?.conferenceId;
        const meetCode = meetLink ? meetLink.split('/').pop() : conferenceId;
        
        scheduledWebinars.push({
          ...webinar,
          google_event: meetEvent,
          presenter_link: meetLink || meetEvent.conferenceData?.entryPoints?.[0]?.uri,
          attendee_link: meetLink || meetEvent.conferenceData?.entryPoints?.[0]?.uri,
          event_id: meetEvent.id,
          meeting_id: conferenceId || meetCode, // Use conferenceId as meeting ID
          meeting_password: 'No password required', // Google Meet doesn't use passwords
          html_link: meetEvent.htmlLink,
          meet_link: meetLink,
          meet_code: meetCode // Additional Google Meet specific field
        });

        console.log(`✅ Created real Google Meet event: ${meetEvent.id} for "${webinar.webinar_name}"`);
        
      } catch (error) {
        console.error(`❌ Failed to create event for "${webinar.webinar_name}":`, error);
        return NextResponse.json(
          { error: `Failed to create Google Meet event for "${webinar.webinar_name}": ${error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      scheduled_webinars: scheduledWebinars,
      message: `✅ Successfully created ${scheduledWebinars.length} REAL Google Meet events!`,
      validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
      skipped_invalid: webinars.length - validWebinars.length
    });

  } catch (error) {
    console.error('Error scheduling Google Meet webinars:', error);
    return NextResponse.json(
      { error: 'Failed to schedule webinars: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
