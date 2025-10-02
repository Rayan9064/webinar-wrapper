# 🎯 Webinar Wrapper - Proof of Concept

A Next.js application that serves as a wrapper tool for hosting webinars on existing platforms like Zoom, Google Meet, etc. This tool can schedule webinars based on Excel file input, send automated emails and WhatsApp reminders, and track attendees.

## 🚀 Features

- **📤 Excel Upload**: Upload Excel files with webinar details
- **📅 Webinar Scheduling**: Schedule webinars on Zoom (simulated for PoC)
- **📧 Email Notifications**: Send schedule and reminder emails to presenters and attendees
- **💬 WhatsApp Integration**: Send WhatsApp notifications via Twilio
- **📊 Dashboard**: View scheduled webinars with presenter and attendee links
- **🔗 Link Generation**: Generate meeting links for presenters and attendees

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **File Processing**: formidable, xlsx
- **Email**: nodemailer
- **WhatsApp**: Twilio
- **Meeting Integration**: Zoom API (simulated for PoC)

## 📋 Required Excel Format

Your Excel file should have the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| webinar_id | Unique identifier | 1 |
| webinar_name | Name of the webinar | "Introduction to AI" |
| date | Date in YYYY-MM-DD format | 2024-01-15 |
| time | Time in HH:MM format | 14:00 |
| presenter_name | Presenter's full name | John Doe |
| presenter_email | Presenter's email | john@example.com |
| presenter_phone | Presenter's phone with country code | 12345678901 |
| attendee_name | Attendee's full name | Jane Smith |
| attendee_email | Attendee's email | jane@example.com |
| attendee_phone | Attendee's phone with country code | 12345678902 |

## 🚀 Getting Started

1. **Clone and Install**:
   ```bash
   git clone <your-repo-url>
   cd webinar-wrapper
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.local` and update with your credentials:
   ```bash
   cp .env.local .env.local.example
   # Edit .env.local with your actual credentials
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
webinar-wrapper/
├── app/
│   ├── api/
│   │   ├── upload/          # Excel file upload and parsing
│   │   ├── schedule/        # Webinar scheduling on Zoom
│   │   ├── send-email/      # Email notifications
│   │   └── send-whatsapp/   # WhatsApp notifications
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Main dashboard UI
├── public/
├── .env.local              # Environment variables
├── next.config.ts
└── package.json
```

## 🔧 Configuration

### Email Setup (Gmail Example)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Use App Password, not regular password
```

### Twilio WhatsApp Setup
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

### Zoom API Setup (for production)
```env
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
ZOOM_JWT_TOKEN=your_zoom_jwt_token
```

## 📝 How to Use

1. **Upload Excel File**: 
   - Prepare an Excel file with the required columns
   - Upload it using the web interface
   - The system will parse and display the webinars

2. **Schedule Webinars**:
   - Click "Schedule on Zoom" to create meetings
   - View the generated presenter and attendee links

3. **Send Notifications**:
   - Use the email and WhatsApp buttons to send notifications
   - Choose between schedule notifications and reminders

## 🎯 Proof of Concept Features

This is a PoC implementation with the following simulations:

- **Zoom Integration**: Simulated meeting creation (real implementation would use Zoom SDK)
- **Email Sending**: Configured for Gmail (requires app password)
- **WhatsApp**: Simulated sending (real implementation would use Twilio)
- **Attendee Tracking**: Basic structure in place for future enhancement

## 🔮 Future Enhancements

- **Real Zoom Integration**: Implement actual Zoom SDK integration
- **Google Meet Support**: Add Google Meet scheduling
- **Attendee Tracking**: Track who joins which webinar
- **Reporting**: Generate attendance reports after events
- **Multiple Attendees**: Support multiple attendees per webinar
- **Bulk Operations**: Handle large Excel files with many webinars
- **Authentication**: Add user authentication and authorization
- **Database**: Store webinar data in a database instead of in-memory

## 🐛 Troubleshooting

### File Upload Issues
- Ensure your Excel file has the correct column headers
- Check file size (max 10MB)
- Use .xlsx or .xls format

### Email Issues
- Use Gmail App Password, not regular password
- Enable 2-factor authentication on Gmail
- Check SMTP settings

### WhatsApp Issues
- Verify Twilio credentials
- Check phone number format (include country code)
- Ensure WhatsApp sandbox is configured

## 👨‍💻 Developer

**GMak Mani**  
📞 +1 (201) 936-6819  
📧 [Contact for development inquiries]

## 📄 License

This is a proof of concept project. Contact the developer for licensing and production use.

---

**Note**: This is a demonstration project. For production use, implement proper error handling, security measures, database storage, and real API integrations.
