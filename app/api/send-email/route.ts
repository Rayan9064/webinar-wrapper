import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Helper function to validate email data
function validateEmailData(webinar: any, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!webinar.presenter_name || webinar.presenter_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter name`);
  }
  
  if (!webinar.presenter_email || webinar.presenter_email.trim() === '') {
    errors.push(`Row ${index + 1}: Missing presenter email`);
  }
  
  if (!webinar.webinar_name || webinar.webinar_name.trim() === '') {
    errors.push(`Row ${index + 1}: Missing webinar name`);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (webinar.presenter_email && !emailRegex.test(webinar.presenter_email)) {
    errors.push(`Row ${index + 1}: Invalid presenter email format`);
  }
  
  if (webinar.attendee_email && !emailRegex.test(webinar.attendee_email)) {
    errors.push(`Row ${index + 1}: Invalid attendee email format`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Send email via nodemailer - REAL EMAIL INTEGRATION
export async function POST(request: NextRequest) {
  try {
    const { webinars, type } = await request.json(); // type: 'schedule' or 'reminder'
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({
        error: 'Email credentials not configured. Please add EMAIL_USER and EMAIL_PASS to .env.local'
      }, { status: 400 });
    }
    
    // Validate all webinars first
    const validWebinars: any[] = [];
    const validationErrors: string[] = [];
    
    webinars.forEach((webinar: any, index: number) => {
      const validation = validateEmailData(webinar, index);
      if (validation.isValid) {
        validWebinars.push(webinar);
      } else {
        validationErrors.push(...validation.errors);
      }
    });

    if (validWebinars.length === 0) {
      return NextResponse.json({
        error: 'No valid webinars found for email sending',
        validation_errors: validationErrors
      }, { status: 400 });
    }

    if (validationErrors.length > 0) {
      console.log('⚠️ Email validation warnings:', validationErrors);
    }
    
    console.log(`📧 Sending REAL emails to ${validWebinars.length} valid webinars...`);
    
    // Configure nodemailer with real Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const emailResults = [];

    for (const webinar of validWebinars) {
      // Email to presenter
      const presenterSubject = type === 'reminder' 
        ? `🔔 Reminder: Your webinar "${webinar.webinar_name}" is coming up!`
        : `📅 Your webinar "${webinar.webinar_name}" has been scheduled`;
        
      const presenterBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hello ${webinar.presenter_name}!</h2>
          <p>${type === 'reminder' ? 'This is a reminder that your webinar is starting soon:' : 'Your webinar has been successfully scheduled:'}</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1e40af;">📋 Webinar Details</h3>
            <p><strong>Title:</strong> ${webinar.webinar_name}</p>
            <p><strong>Date:</strong> ${webinar.date}</p>
            <p><strong>Time:</strong> ${webinar.time}</p>
            ${webinar.meeting_id ? `<p><strong>Meeting ID/Code:</strong> ${webinar.meeting_id}</p>` : ''}
            ${webinar.meeting_password && webinar.meeting_password !== 'No password required' ? `<p><strong>Password:</strong> ${webinar.meeting_password}</p>` : '<p><strong>Password:</strong> No password required</p>'}
            <p><strong>Your Host Link:</strong> <a href="${webinar.presenter_link}" style="color: #2563eb; text-decoration: none;">Join as Host</a></p>
          </div>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h4 style="margin-top: 0; color: #15803d;">👥 Attendee Information</h4>
            <p><strong>Name:</strong> ${webinar.attendee_name}</p>
            <p><strong>Email:</strong> ${webinar.attendee_email}</p>
            <p><strong>Phone:</strong> ${webinar.attendee_phone}</p>
          </div>
          
          <p style="color: #dc2626;"><strong>⏰ Please be ready 10 minutes before the scheduled time.</strong></p>
          <p>Good luck with your webinar! 🚀</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from Webinar Wrapper PoC</p>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: webinar.presenter_email,
          subject: presenterSubject,
          html: presenterBody
        });

        emailResults.push({
          to: webinar.presenter_email,
          type: 'presenter',
          status: 'sent',
          webinar_id: webinar.id
        });

        console.log(`✅ Email sent to presenter: ${webinar.presenter_email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to presenter ${webinar.presenter_email}:`, error);
        emailResults.push({
          to: webinar.presenter_email,
          type: 'presenter',
          status: 'failed',
          webinar_id: webinar.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Email to attendees
      if (webinar.attendee_email) {
        const attendeeSubject = type === 'reminder'
          ? `🔔 Reminder: Webinar "${webinar.webinar_name}" is starting soon!`
          : `📅 You're invited to webinar "${webinar.webinar_name}"`;
          
        const attendeeBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Hello ${webinar.attendee_name}!</h2>
            <p>${type === 'reminder' ? 'This is a reminder about your upcoming webinar:' : 'You have been invited to a webinar:'}</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #15803d;">📋 Webinar Details</h3>
              <p><strong>Title:</strong> ${webinar.webinar_name}</p>
              <p><strong>Presenter:</strong> ${webinar.presenter_name}</p>
              <p><strong>Date:</strong> ${webinar.date}</p>
              <p><strong>Time:</strong> ${webinar.time}</p>
              ${webinar.meeting_id ? `<p><strong>Meeting ID/Code:</strong> ${webinar.meeting_id}</p>` : ''}
              ${webinar.meeting_password && webinar.meeting_password !== 'No password required' ? `<p><strong>Password:</strong> ${webinar.meeting_password}</p>` : '<p><strong>Password:</strong> No password required</p>'}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${webinar.attendee_link}" style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔗 Join Webinar
              </a>
            </div>
            
            <p style="color: #dc2626;"><strong>⏰ Please join on time to not miss any content.</strong></p>
            <p>We look forward to seeing you there! 👋</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated message from Webinar Wrapper PoC</p>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: webinar.attendee_email,
            subject: attendeeSubject,
            html: attendeeBody
          });

          emailResults.push({
            to: webinar.attendee_email,
            type: 'attendee',
            status: 'sent',
            webinar_id: webinar.id
          });

          console.log(`✅ Email sent to attendee: ${webinar.attendee_email}`);
        } catch (error) {
          console.error(`❌ Failed to send email to attendee ${webinar.attendee_email}:`, error);
          emailResults.push({
            to: webinar.attendee_email,
            type: 'attendee',
            status: 'failed',
            webinar_id: webinar.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const sentCount = emailResults.filter(r => r.status === 'sent').length;
    const failedCount = emailResults.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      email_results: emailResults,
      message: `📧 Successfully sent ${sentCount} REAL emails! ${failedCount > 0 ? `(${failedCount} failed)` : ''}`,
      validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
      skipped_invalid: webinars.length - validWebinars.length
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails: ' + (error as Error).message },
      { status: 500 }
    );
  }
}