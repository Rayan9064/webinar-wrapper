# Google Meet Integration Setup Guide

## 🚀 **Quick Setup for Google Meet Integration**

### **Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

### **Step 2: Enable APIs**
1. Go to **APIs & Services** > **Library**
2. Search and enable:
   - **Google Calendar API**
   - **Google Meet API** (if available)

### **Step 3: Create Credentials**
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
5. Download the JSON file

### **Step 4: Update .env.local**
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_from_json
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_json
```

### **Step 5: Alternative - Service Account (Recommended for Production)**
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **Service Account**
3. Create service account
4. Go to **Keys** tab > **ADD KEY** > **Create new key** (JSON)
5. Download the JSON file
6. Add to .env.local:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key\n-----END PRIVATE KEY-----"
```

## 🔧 **Current Implementation Features**

### **✅ What Works:**
- Creates real Google Calendar events
- Automatically generates Google Meet links
- Sends calendar invites to presenters and attendees
- Sets up reminders (24 hours before, 10 minutes before)
- Validates webinar data before creation

### **🎯 **Usage:**
1. Upload Excel file with webinar details
2. Choose **"Schedule on Google Meet"** instead of Zoom
3. System creates calendar events with Meet links
4. Meet links are available for presenters and attendees

### **📧 **Integration:**
- Email notifications will include Google Meet links
- WhatsApp messages will include Google Meet links
- Same validation as Zoom integration

## 🛠️ **Technical Notes**

### **Current Implementation:**
- Uses Google Calendar API v3
- Creates events with `hangoutsMeet` conference type
- Supports both OAuth 2.0 and Service Account auth
- Handles timezone conversion (defaults to UTC)

### **Required Permissions:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

## 🔄 **Next Steps**

1. **Get Google credentials** from Cloud Console
2. **Update .env.local** with real values
3. **Test with sample webinars**
4. **Switch between Zoom and Google Meet** as needed

## 🚨 **Important Notes**

- **Free Tier**: Google Calendar API has generous free limits
- **Authentication**: Service account recommended for production
- **Meet Links**: Automatically generated when calendar event is created
- **Attendees**: Automatically invited via calendar invites
