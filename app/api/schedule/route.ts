import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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

// Generate Zoom OAuth Access Token
async function getZoomAccessToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error('Missing Zoom credentials');
  }

  try {
    const response = await axios.post('https://zoom.us/oauth/token', 
      `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error);
    throw new Error('Failed to get Zoom access token');
  }
}

// Create actual Zoom meeting
async function createZoomMeeting(webinar: WebinarData, accessToken: string) {
  const meetingData = {
    topic: webinar.webinar_name || 'Webinar Meeting',
    type: 2, // Scheduled meeting
    start_time: `${webinar.date}T${webinar.time}:00`,
    duration: 60, // 1 hour
    timezone: 'UTC',
    agenda: `Presenter: ${webinar.presenter_name}`,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      watermark: false,
      use_pmi: false,
      approval_type: 0,
      audio: 'both',
      auto_recording: 'none',
      waiting_room: true
    }
  };

  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw new Error(`Failed to create Zoom meeting: ${error}`);
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

// Call Zoom API to create real meetings
export async function POST(request: NextRequest) {
  try {
    const { webinars } = await request.json();
    const scheduledWebinars = [];
    const validationErrors: string[] = [];

    // Check if we have Zoom credentials
    const hasZoomCredentials = process.env.ZOOM_ACCOUNT_ID && 
                              process.env.ZOOM_CLIENT_ID && 
                              process.env.ZOOM_CLIENT_SECRET;

    if (!hasZoomCredentials) {
      return NextResponse.json(
        { error: 'Zoom credentials not configured. Please add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET to .env.local' },
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

    console.log(`🔄 Creating REAL Zoom meetings for ${validWebinars.length} valid webinars...`);
    
    // Get access token
    const accessToken = await getZoomAccessToken();
    
    for (const webinar of validWebinars) {
      try {
        // Create real Zoom meeting
        const zoomMeeting = await createZoomMeeting(webinar, accessToken);
        
        scheduledWebinars.push({
          ...webinar,
          zoom_meeting: zoomMeeting,
          presenter_link: zoomMeeting.start_url,
          attendee_link: zoomMeeting.join_url,
          meeting_id: zoomMeeting.id,
          meeting_password: zoomMeeting.password,
          meeting_uuid: zoomMeeting.uuid
        });

        console.log(`✅ Created real Zoom meeting: ${zoomMeeting.id} for "${webinar.webinar_name}"`);
        
      } catch (error) {
        console.error(`❌ Failed to create meeting for "${webinar.webinar_name}":`, error);
        return NextResponse.json(
          { error: `Failed to create Zoom meeting for "${webinar.webinar_name}": ${error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      scheduled_webinars: scheduledWebinars,
      message: `✅ Successfully created ${scheduledWebinars.length} REAL Zoom meetings!`,
      validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
      skipped_invalid: webinars.length - validWebinars.length
    });

  } catch (error) {
    console.error('Error scheduling webinars:', error);
    return NextResponse.json(
      { error: 'Failed to schedule webinars: ' + (error as Error).message },
      { status: 500 }
    );
  }
}