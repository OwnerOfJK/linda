'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface FriendRequestType {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  friend: {
    id: string;
    name: string | null;
    phone: string;
    profile_picture_url: string | null;
  };
}

export default function FriendRequests() {
  const [pendingRequests, setPendingRequests] = useState<FriendRequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch pending friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        const { data, error } = await supabase
          .from('friends')
          .select(`
            id,
            user_id,
            friend_id,
            status,
            created_at,
            friend:users!friend_id(id, name, phone, profile_picture_url)
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        if (error) {
          throw error;
        }
        
        // Transform data to ensure it matches our expected type
        const transformedData = data?.map(item => ({
          ...item,
          friend: Array.isArray(item.friend) ? item.friend[0] : item.friend
        })) || [];
        
        setPendingRequests(transformedData as FriendRequestType[]);
      } catch (err) {
        setError('Failed to load friend requests');
        console.error('Error fetching friend requests:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFriendRequests();
  }, []);
  
  const handleFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/friends/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} friend request`);
      }
      
      // Remove the request from the list
      setPendingRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} friend request`);
      console.error(`Error ${action}ing friend request:`, err);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading friend requests...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }
  
  if (pendingRequests.length === 0) {
    return <div className="p-4 text-center text-gray-500">No pending friend requests</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h3 className="text-xl font-semibold p-4 border-b">Friend Requests</h3>
      
      <ul className="divide-y divide-gray-200">
        {pendingRequests.map((request) => (
          <li key={request.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                {request.friend.profile_picture_url ? (
                  <Image
                    src={request.friend.profile_picture_url}
                    alt={request.friend.name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div>
                <p className="font-medium">{request.friend.name || 'Unknown User'}</p>
                <p className="text-sm text-gray-500">{request.friend.phone}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleFriendRequest(request.id, 'accept')}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Accept
              </button>
              
              <button
                onClick={() => handleFriendRequest(request.id, 'decline')}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 