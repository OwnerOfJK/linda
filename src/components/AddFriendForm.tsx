'use client';

import { useState } from 'react';

export default function AddFriendForm() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      setMessage({ text: 'Please enter a phone number', type: 'error' });
      return;
    }
    
    // Sanitize phone number (ensure it has a + prefix)
    const sanitizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Call the API to send a friend request
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: sanitizedPhone }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }
      
      setMessage({ 
        text: data.smsSent 
          ? 'Invitation sent via SMS' 
          : 'Friend request sent successfully',
        type: 'success'
      });
      setPhone('');
      
    } catch (err) {
      setMessage({ 
        text: err instanceof Error ? err.message : 'Failed to send friend request',
        type: 'error'
      });
      console.error('Error sending friend request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Add a Friend</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="friendPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Friend&apos;s Phone Number
          </label>
          <input
            id="friendPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter phone number with country code (e.g., +1 for US)
          </p>
        </div>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Friend Request'}
        </button>
      </form>
    </div>
  );
} 