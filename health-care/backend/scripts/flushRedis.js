/**
 * Force-flush all Redis cache keys using the correct TLS config.
 * Run: node scripts/flushRedis.js
 */
require('dotenv').config({ path: '.env.production' });
const Redis = require('ioredis');

const configs = [
  // Try 1: rediss:// scheme (TLS)
  { url: `rediss://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB || 0}`, tls: { rejectUnauthorized: false } },
  // Try 2: redis:// (no TLS)
  { url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB || 0}` },
  // Try 3: host/port config with TLS
  { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT), password: process.env.REDIS_PASSWORD, db: parseInt(process.env.REDIS_DB) || 0, tls: { rejectUnauthorized: false } },
];

async function tryConnect(config) {
  return new Promise((resolve) => {
    const client = config.url
      ? new Redis(config.url, config.tls ? { tls: config.tls } : {})
      : new Redis(config);

    const timeout = setTimeout(() => {
      client.disconnect();
      resolve(null);
    }, 5000);

    client.on('ready', () => {
      clearTimeout(timeout);
      resolve(client);
    });
    client.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

async function run() {
  console.log(`Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}\n`);

  let client = null;
  for (let i = 0; i < configs.length; i++) {
    console.log(`Trying config ${i + 1}...`);
    client = await tryConnect(configs[i]);
    if (client) { console.log(`Connected with config ${i + 1}\n`); break; }
    console.log(`Config ${i + 1} failed`);
  }

  if (!client) {
    console.error('Could not connect to Redis with any config. Cache will expire naturally (max 1 hour).');
    process.exit(0);
  }

  const patterns = ['products:*', 'homepage:*', 'categories:*'];
  let total = 0;
  for (const pat of patterns) {
    const keys = await client.keys(pat);
    if (keys.length) {
      await client.del(keys);
      console.log(`Deleted ${keys.length} keys matching ${pat}`);
      total += keys.length;
    } else {
      console.log(`No keys for ${pat}`);
    }
  }

  console.log(`\n✅ Flushed ${total} cache keys`);
  client.quit();
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
