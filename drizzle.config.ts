import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

try {
  const dns = require('dns');
  const originalLookup = dns.lookup;
  // @ts-ignore
  dns.lookup = function(hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (hostname.includes('neon.tech')) {
      // @ts-ignore
      return callback(null, [{ address: '52.4.160.253', family: 4 }]);
    }
    return originalLookup(hostname, options, callback);
  };
} catch (e) {}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
