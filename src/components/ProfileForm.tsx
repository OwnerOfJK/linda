'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface City {
  id: string;
  name: string;
  country: string;
}

export default function ProfileForm() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list of cities from Supabase
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, country')
        .order('name');
      
      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }
      
      setCities(data || []);
    };
    
    fetchCities();
  }, []);

  // Handle file selection for profile picture
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    
    setProfilePicture(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!city) {
      setError('Please select your city');
      return;
    }
    
    if (!profilePicture) {
      setError('Please upload a profile picture');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Upload profile picture to Supabase Storage
      const fileName = `${user.id}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, profilePicture);
      
      if (uploadError) {
        throw new Error('Failed to upload profile picture');
      }
      
      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);
      
      // Update user profile in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          city,
          profile_picture_url: urlData.publicUrl
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw new Error('Failed to update profile');
      }
      
      // Redirect to map view
      router.push('/map');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Profile Picture */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          
          <div className="flex flex-col items-center">
            {previewUrl ? (
              <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Profile preview"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            
            <label className="cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
              {previewUrl ? 'Change Picture' : 'Upload Picture'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* City Selection */}
        <div className="mb-6">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select your city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
} 