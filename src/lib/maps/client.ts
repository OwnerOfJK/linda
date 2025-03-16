import { Loader } from '@googlemaps/js-api-loader';

export const initGoogleMaps = async () => {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is missing');
  }

  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '';
  
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places', 'marker'],
    mapIds: mapId ? [mapId] : undefined
  });

  try {
    const google = await loader.load();
    return { google, mapId };
  } catch (error) {
    console.error('Error loading Google Maps:', error);
    throw error;
  }
}; 