import { apiClient } from './client';
import type { NominatimLocation } from '../types/nominatim';

export const nominatimApi = {
  /**
   * Search for address suggestions
   * @param query - Search query (minimum 5 characters)
   * @returns Array of location suggestions
   */
  async searchAddresses(query: string): Promise<NominatimLocation[]> {
    if (!query || query.trim().length < 5) {
      return [];
    }

    try {
      const response = await apiClient.get<NominatimLocation[]>(
        `/nominatim/search?q=${encodeURIComponent(query)}`
      );
      return response;
    } catch (error) {
      console.error('Failed to search addresses:', error);
      return [];
    }
  },
};
