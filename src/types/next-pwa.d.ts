declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  type PWAConfig = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    publicExcludes?: string[];
    buildExcludes?: string[] | RegExp[];
    dynamicStartUrl?: boolean;
    reloadOnOnline?: boolean;
    fallbacks?: Record<string, string>;
    cacheOnFrontEndNav?: boolean;
    subdomainPrefix?: string;
  };

  export default function withPWA(pwaConfig: PWAConfig): 
    (nextConfig: NextConfig) => NextConfig;
} 