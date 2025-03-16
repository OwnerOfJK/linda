/**
 * Remote logger client that sends logs to our Supabase Edge Function
 */

import { supabase } from './supabase/client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

const isDev = process.env.NODE_ENV === 'development';
const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/log-events`
  : '';

/**
 * Logger that both logs to console and sends logs to the remote server
 */
class RemoteLogger {
  private context: string;
  private enabled: boolean;
  private batch: Array<{level: LogLevel, message: string, data: LogData, timestamp: string}> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isSending = false;

  constructor(context: string) {
    this.context = context;
    this.enabled = !!SUPABASE_FUNCTION_URL;
    
    // Ensure logs are sent before page unloads
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendBatch(true);
      });
    }
  }

  /**
   * Log a message with the specified level and additional data
   */
  private log(level: LogLevel, message: string, data: LogData = {}) {
    const timestamp = new Date().toISOString();
    
    // Always log to console first
    if (isDev) {
      console[level](`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`, 
        Object.keys(data).length ? data : '');
    } else {
      console[level](JSON.stringify({
        timestamp,
        level,
        context: this.context,
        message,
        ...data
      }));
    }
    
    // Skip remote logging if not enabled or in development
    if (!this.enabled || isDev) return;
    
    // Add to batch
    this.batch.push({
      level,
      message,
      data: {
        ...data,
        context: this.context
      },
      timestamp
    });
    
    // Schedule batch send if not already scheduled
    if (!this.batchTimer && !this.isSending) {
      this.batchTimer = setTimeout(() => {
        this.sendBatch();
      }, 2000); // Send batch every 2 seconds
    }
  }

  /**
   * Send batched logs to the server
   */
  private async sendBatch(immediate = false) {
    if (this.batch.length === 0 || !this.enabled) return;
    
    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Don't send if already sending (unless immediate)
    if (this.isSending && !immediate) return;
    
    this.isSending = true;
    const batchToSend = [...this.batch];
    this.batch = [];
    
    try {
      // Use the Supabase client for authentication
      const { data: accessToken } = await supabase.auth.getSession();
      
      // Send logs to the Supabase Edge Function
      await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken?.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          logs: batchToSend,
        }),
      });
    } catch (error) {
      // Log error but don't throw - we don't want logging errors to break the app
      console.error('Failed to send logs to server:', error);
      
      // Add unsent logs back to the batch
      this.batch = [...batchToSend, ...this.batch];
    } finally {
      this.isSending = false;
      
      // If we have more logs that came in while sending, schedule another send
      if (this.batch.length > 0 && !this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.sendBatch();
        }, 2000);
      }
    }
  }

  debug(message: string, data: LogData = {}) {
    this.log('debug', message, data);
  }

  info(message: string, data: LogData = {}) {
    this.log('info', message, data);
  }

  warn(message: string, data: LogData = {}) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data: LogData = {}) {
    const errorData = error ? {
      errorMessage: error.message,
      stack: error.stack,
      ...data
    } : data;
    
    this.log('error', message, errorData);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createRemoteLogger(context: string) {
  return new RemoteLogger(context);
}

// Default instance
export default new RemoteLogger('app'); 