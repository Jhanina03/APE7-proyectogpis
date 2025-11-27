import { Injectable, BadRequestException, Logger } from '@nestjs/common';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  importance: number;
}

interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

@Injectable()
export class NominatimService {
  private readonly logger = new Logger(NominatimService.name);
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private cache = new Map<string, { result: GeocodeResult; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Geocode an address using Nominatim API
   * Returns lat/lon for storing in database
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException('Address cannot be empty');
    }

    if (address.trim().length < 5) {
      throw new BadRequestException('Address is too short. Provide more details.');
    }

    // Check cache first
    const cached = this.cache.get(address);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for address: ${address}`);
      return cached.result;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/search?format=json&q=${encodedAddress}&countrycodes=ec&limit=1`;

      this.logger.debug(`Geocoding address: ${address}`);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'SafeTrade-App' },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data: NominatimResponse[] = await response.json();

      if (!data || data.length === 0) {
        this.logger.warn(`No results found for address: ${address}`);
        throw new BadRequestException(
          `Address not found in Ecuador. Please check the spelling or try a different location.`
        );
      }

      const result = {
        address: data[0].display_name,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        type: data[0].type,
        importance: data[0].importance,
      };

      // Warn if low confidence match
      if (result.importance < 0.3) {
        this.logger.warn(
          `Low confidence match for "${address}". Score: ${result.importance}`
        );
      }

      // Cache the result
      this.cache.set(address, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Geocoding error for "${address}":`, error);
      throw new BadRequestException('Failed to geocode address. Try again later.');
    }
  }

  /**
   * Search for multiple address suggestions
   * Used for autocomplete/search functionality
   */
  async searchAddresses(query: string, limit: number = 4): Promise<GeocodeResult[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    if (query.trim().length < 5) {
      throw new BadRequestException('Search query must be at least 5 characters');
    }

    // Check cache first (cache key includes limit)
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Cache hit for search: ${query}`);
      return cached.result as any as GeocodeResult[];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search?format=json&q=${encodedQuery}&countrycodes=ec&limit=${limit}`;

      this.logger.debug(`Searching addresses: ${query}`);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'SafeTrade-App' },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data: NominatimResponse[] = await response.json();

      if (!data || data.length === 0) {
        this.logger.debug(`No results found for search: ${query}`);
        return [];
      }

      const results: GeocodeResult[] = data.map((item) => ({
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
      }));

      // Cache the results
      this.cache.set(cacheKey, { result: results as any, timestamp: Date.now() });

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Search error for "${query}":`, error);
      throw new BadRequestException('Failed to search addresses. Try again later.');
    }
  }

  /**
   * Clear cache if needed
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }
}