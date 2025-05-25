import axios from 'axios';
import { LocationData } from '../types/traceroute';

export class GeolocationService {
  private cache: Map<string, LocationData> = new Map();
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.IPSTACK_API_KEY || process.env.IPINFO_TOKEN;
  }

  async getLocationData(ipAddress: string): Promise<LocationData | undefined> {
    // Check cache first
    if (this.cache.has(ipAddress)) {
      return this.cache.get(ipAddress);
    }

    try {
      let locationData: LocationData | undefined;

      // Try multiple geolocation services
      if (this.apiKey) {
        locationData = await this.getFromIPStack(ipAddress);
      }
      
      if (!locationData) {
        locationData = await this.getFromIPInfo(ipAddress);
      }

      if (!locationData) {
        locationData = await this.getFromIPAPI(ipAddress);
      }

      if (locationData) {
        this.cache.set(ipAddress, locationData);
      }

      return locationData;
    } catch (error) {
      console.warn(`Failed to get location data for ${ipAddress}:`, error);
      return undefined;
    }
  }

  private async getFromIPStack(ipAddress: string): Promise<LocationData | undefined> {
    if (!this.apiKey) return undefined;

    try {
      const response = await axios.get(
        `http://api.ipstack.com/${ipAddress}?access_key=${this.apiKey}`,
        { timeout: 5000 }
      );

      const data = response.data;
      if (data.error) {
        console.warn('IPStack API error:', data.error);
        return undefined;
      }

      return {
        country: data.country_name,
        city: data.city,
        isp: data.connection?.isp,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.time_zone?.id
      };
    } catch (error) {
      console.warn('IPStack API request failed:', error);
      return undefined;
    }
  }

  private async getFromIPInfo(ipAddress: string): Promise<LocationData | undefined> {
    try {
      const token = this.apiKey ? `?token=${this.apiKey}` : '';
      const response = await axios.get(
        `https://ipinfo.io/${ipAddress}/json${token}`,
        { timeout: 5000 }
      );

      const data = response.data;
      if (data.error) {
        console.warn('IPInfo API error:', data.error);
        return undefined;
      }

      const [latitude, longitude] = data.loc ? data.loc.split(',').map(Number) : [undefined, undefined];

      return {
        country: data.country,
        city: data.city,
        isp: data.org,
        latitude,
        longitude,
        timezone: data.timezone
      };
    } catch (error) {
      console.warn('IPInfo API request failed:', error);
      return undefined;
    }
  }

  private async getFromIPAPI(ipAddress: string): Promise<LocationData | undefined> {
    try {
      const response = await axios.get(
        `http://ip-api.com/json/${ipAddress}?fields=status,message,country,city,isp,lat,lon,timezone`,
        { timeout: 5000 }
      );

      const data = response.data;
      if (data.status === 'fail') {
        console.warn('IP-API error:', data.message);
        return undefined;
      }

      return {
        country: data.country,
        city: data.city,
        isp: data.isp,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone
      };
    } catch (error) {
      console.warn('IP-API request failed:', error);
      return undefined;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
