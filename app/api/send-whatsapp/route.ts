import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Helper function to format phone number with country code
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // If it starts with country code (more than 10 digits), use as is
  if (cleanPhone.length > 10) {
    return `+${cleanPhone}`;
  }
  
  // If it's 10 digits, assume US number and add +1
  if (cleanPhone.length === 10) {
    return `+1${cleanPhone}`;
  }
  
  // If it's less than 10 digits, assume US and pad if needed
  // For Indian numbers (assuming based on your number), add +91
  if (cleanPhone.length === 10 && cleanPhone.startsWith('7')) {
    return `+91${cleanPhone}`;
  }
  
  // Default: add +1 for US
  return `+1${cleanPhone}`;
}

// Helper function to validate WhatsApp data
function validateWhatsAppData(webinar: any, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!webinar.presenter_name || webinar.presenter_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter name`);
  }
  
  if (!webinar.presenter_phone || webinar.presenter_phone.toString().trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter phone`);
  }
  
  if (!webinar.webinar_name || webinar.webinar_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing webinar name`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Send WhatsApp message via Twilio - REAL WHATSAPP INTEGRATION
export async function POST(request: NextRequest) {
  try {
    const { webinars, type } = await request.json(); // type: 'schedule' or 'reminder'
    
    // Check if Twilio credentials are configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
    
    if (!accountSid || !authToken || accountSid === 'your_account_sid') {
      return NextResponse.json({
        error: 'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env.local'
      }, { status: 400 });
    }

    // Validate all webinars first
    const validWebinars: any[] = [];
    const validationErrors: string[] = [];
    
    webinars.forEach((webinar: any, index: number) => {
      const validation = validateWhatsAppData(webinar, index);
      if (validation.isValid) {
        validWebinars.push(webinar);
      } else {
        validationErrors.push(...validation.errors);
      }
    });

    if (validWebinars.length === 0) {
      return NextResponse.json({
        error: 'No valid webinars found for WhatsApp sending',
        validation_errors: validationErrors
      }, { status: 400 });
    }

    if (validationErrors.length > 0) {
      console.log('⚠️ WhatsApp validation warnings:', validationErrors);
    }
    
    console.log(`📱 Sending REAL WhatsApp messages to ${validWebinars.length} valid webinars...`);
    
    // Initialize Twilio client with real credentials
    const client = twilio(accountSid, authToken);

    const whatsappResults = [];

    for (const webinar of validWebinars) {
      // Create meeting info based on platform
      const meetingInfo = webinar.meeting_password && webinar.meeting_password !== 'No password required'
        ? `🆔 Meeting ID: ${webinar.meeting_id}\n🔑 Password: ${webinar.meeting_password}`
        : `🆔 Meeting Code: ${webinar.meeting_id}\n🔑 No password required`;

      // WhatsApp to presenter
      const presenterMessage = type === 'reminder'
        ? `🔔 *REMINDER* - Your webinar "${webinar.webinar_name}" starts soon!\n\n📅 Date: ${webinar.date}\n⏰ Time: ${webinar.time}\n\n🎯 Host Link: ${webinar.presenter_link}\n${meetingInfo}\n\nPlease join 10 minutes early to test your setup!`
        : `✅ *WEBINAR SCHEDULED* - "${webinar.webinar_name}"\n\n📅 Date: ${webinar.date}\n⏰ Time: ${webinar.time}\n👥 Attendee: ${webinar.attendee_name}\n\n🎯 Host Link: ${webinar.presenter_link}\n${meetingInfo}`;

      try {
        if (accountSid !== 'your_account_sid') {
          // Send real WhatsApp message
          const formattedPresenterPhone = formatPhoneNumber(webinar.presenter_phone);
          const message = await client.messages.create({
            body: presenterMessage,
            from: twilioPhone,
            to: `whatsapp:${formattedPresenterPhone}`
          });

          whatsappResults.push({
            to: webinar.presenter_phone,
            type: 'presenter',
            status: 'sent',
            webinar_id: webinar.id,
            message_sid: message.sid,
            formatted_phone: formattedPresenterPhone
          });
          
          console.log(`✅ WhatsApp sent to presenter: ${webinar.presenter_phone}`);
        } else {
          // Simulate for demo
          whatsappResults.push({
            to: webinar.presenter_phone,
            type: 'presenter',
            status: 'simulated',
            webinar_id: webinar.id,
            message_sid: 'SIM' + Math.random().toString(36).substr(2, 32)
          });
          
          console.log(`📱 SIMULATED WhatsApp to presenter: ${webinar.presenter_phone}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send WhatsApp to presenter ${webinar.presenter_phone}:`, error);
        whatsappResults.push({
          to: webinar.presenter_phone,
          type: 'presenter',
          status: 'failed',
          webinar_id: webinar.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // WhatsApp to attendees
      if (webinar.attendee_phone) {
        const attendeeMessage = type === 'reminder'
          ? `🔔 *REMINDER* - Webinar "${webinar.webinar_name}" starts soon!\n\n📅 Date: ${webinar.date}\n⏰ Time: ${webinar.time}\n👨‍🏫 Presenter: ${webinar.presenter_name}\n\n🚀 Join Link: ${webinar.attendee_link}\n${meetingInfo}\n\nSee you there!`
          : `📅 *WEBINAR INVITATION* - "${webinar.webinar_name}"\n\n📅 Date: ${webinar.date}\n⏰ Time: ${webinar.time}\n👨‍🏫 Presenter: ${webinar.presenter_name}\n\n🚀 Join Link: ${webinar.attendee_link}\n${meetingInfo}`;

        try {
          if (accountSid !== 'your_account_sid') {
            // Send real WhatsApp message
            const formattedAttendeePhone = formatPhoneNumber(webinar.attendee_phone);
            const message = await client.messages.create({
              body: attendeeMessage,
              from: twilioPhone,
              to: `whatsapp:${formattedAttendeePhone}`
            });

            whatsappResults.push({
              to: webinar.attendee_phone,
              type: 'attendee',
              status: 'sent',
              webinar_id: webinar.id,
              message_sid: message.sid,
              formatted_phone: formattedAttendeePhone
            });
            
            console.log(`✅ WhatsApp sent to attendee: ${webinar.attendee_phone}`);
          } else {
            // Simulate for demo
            whatsappResults.push({
              to: webinar.attendee_phone,
              type: 'attendee',
              status: 'simulated',
              webinar_id: webinar.id,
              message_sid: 'SIM' + Math.random().toString(36).substr(2, 32)
            });
            
            console.log(`📱 SIMULATED WhatsApp to attendee: ${webinar.attendee_phone}`);
          }
        } catch (error) {
          console.error(`❌ Failed to send WhatsApp to attendee ${webinar.attendee_phone}:`, error);
          whatsappResults.push({
            to: webinar.attendee_phone,
            type: 'attendee',
            status: 'failed',
            webinar_id: webinar.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const sentCount = whatsappResults.filter(r => r.status === 'sent').length;
    const simulatedCount = whatsappResults.filter(r => r.status === 'simulated').length;
    const failedCount = whatsappResults.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      whatsapp_results: whatsappResults,
      message: `📱 Successfully sent ${sentCount} REAL WhatsApp messages! ${failedCount > 0 ? `(${failedCount} failed)` : ''}`,
      validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
      skipped_invalid: webinars.length - validWebinars.length,
      sent_count: sentCount,
      failed_count: failedCount
    });

  } catch (error) {
    console.error('Error sending WhatsApp messages:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp messages' },
      { status: 500 }
    );
  }
}
