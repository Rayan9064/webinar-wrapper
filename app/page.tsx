'use client';

import { useState } from 'react';

// Create a file upload form that sends the file to /api/upload and displays parsed webinars in a table
export default function Home() {
  const [webinars, setWebinars] = useState<any[]>([]);
  const [scheduledWebinars, setScheduledWebinars] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);
    setMessage('');

    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setWebinars(result.webinars);
        setMessage(result.message);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error uploading file');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleScheduleWebinars = async () => {
    if (webinars.length === 0) {
      setMessage('Please upload webinars first');
      return;
    }

    setIsScheduling(true);
    setMessage('');

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webinars }),
      });

      const result = await response.json();
      
      if (result.success) {
        setScheduledWebinars(result.scheduled_webinars);
        setMessage(result.message);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error scheduling webinars');
      console.error('Schedule error:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleScheduleGoogleMeet = async () => {
    if (webinars.length === 0) {
      setMessage('Please upload webinars first');
      return;
    }

    setIsScheduling(true);
    setMessage('');

    try {
      const response = await fetch('/api/schedule-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webinars }),
      });

      const result = await response.json();
      
      if (result.success) {
        setScheduledWebinars(result.scheduled_webinars);
        setMessage(result.message);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error scheduling Google Meet webinars');
      console.error('Google Meet schedule error:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSendEmails = async (type: 'schedule' | 'reminder') => {
    if (scheduledWebinars.length === 0) {
      setMessage('Please schedule webinars first');
      return;
    }

    setIsSendingEmails(true);
    setMessage('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webinars: scheduledWebinars, type }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`${type === 'reminder' ? 'Reminder' : 'Schedule'} emails sent successfully`);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error sending emails');
      console.error('Email error:', error);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleSendWhatsApp = async (type: 'schedule' | 'reminder') => {
    if (scheduledWebinars.length === 0) {
      setMessage('Please schedule webinars first');
      return;
    }

    setIsSendingWhatsApp(true);
    setMessage('');

    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webinars: scheduledWebinars, type }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`${type === 'reminder' ? 'Reminder' : 'Schedule'} WhatsApp messages sent successfully`);
      } else {
        setMessage('Error: ' + result.error);
      }
    } catch (error) {
      setMessage('Error sending WhatsApp messages');
      console.error('WhatsApp error:', error);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🎯 Webinar Wrapper - Proof of Concept
        </h1>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📤 1. Upload Excel File</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel file with webinar details
              </label>
              <input
                type="file"
                id="file"
                name="file"
                accept=".xlsx,.xls"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload & Parse'}
            </button>
          </form>
        </div>

        {/* Parsed Webinars Table */}
        {webinars.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Parsed Webinars</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Webinar Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {webinars.map((webinar, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.webinar_id || webinar.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.webinar_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex space-x-4">
                <button
                  onClick={handleScheduleWebinars}
                  disabled={isScheduling}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isScheduling ? 'Scheduling...' : '📅 Schedule on Zoom'}
                </button>
                <button
                  onClick={handleScheduleGoogleMeet}
                  disabled={isScheduling}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isScheduling ? 'Scheduling...' : '📅 Schedule on Google Meet'}
                </button>
              </div>
              <p className="text-sm text-gray-600">Choose your preferred meeting platform above</p>
            </div>
          </div>
        )}

        {/* Scheduled Webinars with Links */}
        {scheduledWebinars.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">✅ Scheduled Webinars with Links</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Webinar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presenter Link</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Link</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledWebinars.map((webinar, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.webinar_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.date} {webinar.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.presenter_phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{webinar.attendee_phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a href={webinar.presenter_link} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800 underline">
                          Host Link
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a href={webinar.attendee_link} target="_blank" rel="noopener noreferrer" 
                           className="text-green-600 hover:text-green-800 underline">
                          Join Link
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{webinar.meeting_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">📧 Communication Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleSendEmails('schedule')}
                  disabled={isSendingEmails}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSendingEmails ? 'Sending...' : '📧 Send Schedule Emails'}
                </button>
                
                <button
                  onClick={() => handleSendEmails('reminder')}
                  disabled={isSendingEmails}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSendingEmails ? 'Sending...' : '🔔 Send Reminder Emails'}
                </button>
                
                <button
                  onClick={() => handleSendWhatsApp('schedule')}
                  disabled={isSendingWhatsApp}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSendingWhatsApp ? 'Sending...' : '💬 Send WhatsApp Schedule'}
                </button>
                
                <button
                  onClick={() => handleSendWhatsApp('reminder')}
                  disabled={isSendingWhatsApp}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isSendingWhatsApp ? 'Sending...' : '🔔 Send WhatsApp Reminders'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions for Testing</h3>
          <div className="text-blue-800 space-y-2">
            <p><strong>Excel Format:</strong> Your Excel should have columns like: webinar_id, webinar_name, date, time, presenter_name, presenter_email, presenter_phone, attendee_name, attendee_email, attendee_phone</p>
            <p><strong>Sample File:</strong> Use the included "sample-webinars.xlsx" file which contains 10 sample webinars with complete presenter and attendee details</p>
            <p><strong>Date Format:</strong> Use YYYY-MM-DD format (e.g., 2025-07-15)</p>
            <p><strong>Time Format:</strong> Use HH:MM format (e.g., 14:30)</p>
            <p><strong>Phone Format:</strong> Include country code (e.g., 15551234567)</p>
            <p><strong>Attendee Support:</strong> The system now displays and processes both presenter and attendee information from your Excel file</p>
            <p><strong>Note:</strong> This is a PoC - Zoom meetings are simulated, emails/WhatsApp require proper credentials in production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
