import { CITY_CENTERS } from '../config/constants';
import type { CityCoordinates } from '../types';

/**
 * Get approximate city center coordinates for a given city and country
 * Returns null if city is not in the lookup table
 */
export function getCityCoordinates(
  city: string | null,
  country: string | null
): CityCoordinates | null {
  if (!city || !country) return null;

  const cityKey = `${city}-${country}`;
  return CITY_CENTERS[cityKey] || null;
}
