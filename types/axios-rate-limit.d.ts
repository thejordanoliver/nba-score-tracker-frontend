declare module 'axios-rate-limit' {
  import { AxiosInstance } from 'axios';

  interface RateLimitOptions {
    maxRequests: number;
    perMilliseconds: number;
    maxRPS?: number;
  }

  export default function rateLimit(
    axiosInstance: AxiosInstance,
    options: RateLimitOptions
  ): AxiosInstance;
}
