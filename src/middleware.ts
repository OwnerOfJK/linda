import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from './lib/logger';

export function middleware(request: NextRequest) {
  // Only log API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    // Log the request
    logger.info(`API Request started`, {
      requestId,
      method: request.method,
      url: request.nextUrl.pathname,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      userAgent: request.headers.get('user-agent'),
    });

    // We can't directly modify the response in middleware
    // But we can log in a delayed manner using Response.json()
    const response = NextResponse.next();
    
    // Add request ID to response headers for correlation
    response.headers.set('x-request-id', requestId);
    
    // Log response after a slight delay
    setTimeout(() => {
      const duration = Date.now() - start;
      logger.info(`API Request completed`, {
        requestId,
        duration: `${duration}ms`,
        method: request.method,
        url: request.nextUrl.pathname,
      });
    }, 0);

    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};