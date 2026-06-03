/* eslint-disable @typescript-eslint/no-require-imports */
// This file uses require() intentionally for runtime-conditional DNS patching in Node.js.
// It must NOT run in the Edge runtime, hence the guards below.
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  try {
    const dns = require('dns');
    const originalLookup = dns.lookup;
    dns.lookup = function (hostname: string, options: unknown, callback: unknown) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (hostname.includes('neon.tech')) {
        return (callback as Function)(null, [{ address: '52.4.160.253', family: 4 }]);
      }
      return originalLookup(hostname, options, callback);
    };

    // Inject WebSocket constructor for Node.js
    const ws = require('ws');
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.webSocketConstructor = ws;
  } catch (e) {
    console.warn('Failed to apply DNS lookup override:', e);
  }
}

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
