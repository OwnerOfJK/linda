import type { CityCoordinates } from '../types';

export const CITY_CENTERS: Record<string, CityCoordinates> = {
  // North America
  'New York-USA': { lat: 40.7128, lon: -74.0060 },
  'Los Angeles-USA': { lat: 34.0522, lon: -118.2437 },
  'Chicago-USA': { lat: 41.8781, lon: -87.6298 },
  'San Francisco-USA': { lat: 37.7749, lon: -122.4194 },
  'Toronto-Canada': { lat: 43.6532, lon: -79.3832 },

  // Europe
  'London-UK': { lat: 51.5074, lon: -0.1278 },
  'Paris-France': { lat: 48.8566, lon: 2.3522 },
  'Berlin-Germany': { lat: 52.5200, lon: 13.4050 },
  'Madrid-Spain': { lat: 40.4168, lon: -3.7038 },
  'Rome-Italy': { lat: 41.9028, lon: 12.4964 },

  // Asia
  'Tokyo-Japan': { lat: 35.6762, lon: 139.6503 },
  'Beijing-China': { lat: 39.9042, lon: 116.4074 },
  'Singapore-Singapore': { lat: 1.3521, lon: 103.8198 },
  'Mumbai-India': { lat: 19.0760, lon: 72.8777 },
  'Seoul-South Korea': { lat: 37.5665, lon: 126.9780 },

  // South America
  'Buenos Aires-Argentina': { lat: -34.6037, lon: -58.3816 },
  'São Paulo-Brazil': { lat: -23.5505, lon: -46.6333 },

  // Oceania
  'Sydney-Australia': { lat: -33.8688, lon: 151.2093 },
  'Melbourne-Australia': { lat: -37.8136, lon: 144.9631 },
};

export const PORT = 3000;
