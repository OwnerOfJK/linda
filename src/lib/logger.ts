/**
 * Logger utility for API routes and server components
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Custom logger for structured logging
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log a message with the specified level and additional data
   */
  private log(level: LogLevel, message: string, data: LogData = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...data,
    };

    // Format logs differently in development vs production
    if (isDev) {
      // More readable format for development
      console[level](`[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`, 
        Object.keys(data).length ? data : '');
    } else {
      // JSON format for production (easier to parse by log aggregation tools)
      console[level](JSON.stringify(logEntry));
    }
  }

  debug(message: string, data: LogData = {}) {
    if (isDev) this.log('debug', message, data);
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
export function createLogger(context: string) {
  return new Logger(context);
}

// Default instance
export default new Logger('app');