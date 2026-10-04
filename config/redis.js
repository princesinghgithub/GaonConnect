const Redis = require('ioredis');

const retryStrategy = (times) => {
  if (times > 10) {
    console.error('❌ Redis: Max retry attempts reached');
    return null;
  }
  const delay = Math.min(times * 100, 3000);
  console.warn(`⚠️  Redis: Retrying connection (attempt ${times}) in ${delay}ms`);
  return delay;
};

// REDIS_URL set hai (Upstash/cloud) — URL se connect karo
// Warna local host/port/password use karo
//
// REDIS_KEY_PREFIX — local test backend wahi Upstash use kare to apni har
// key ke aage "dev:" — live server ki settings cache / OTP keys se takraav nahi
const keyPrefix = process.env.REDIS_KEY_PREFIX || '';
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      keyPrefix,
      lazyConnect:          true,
      maxRetriesPerRequest: 3,
      retryStrategy,
      tls: { rejectUnauthorized: false }, // Upstash TLS ke liye
    })
  : new Redis({
      host:                 process.env.REDIS_HOST     || '127.0.0.1',
      port:                 parseInt(process.env.REDIS_PORT || '6379'),
      password:             process.env.REDIS_PASSWORD || undefined,
      db:                   parseInt(process.env.REDIS_DB   || '0'),
      keyPrefix,
      lazyConnect:          true,
      maxRetriesPerRequest: 3,
      retryStrategy,
    });

redis.on('connect',   () => console.log('✅ Redis: Connected'));
redis.on('ready',     () => console.log('✅ Redis: Ready'));
redis.on('error',     (err) => console.error('❌ Redis Error:', err.message));
redis.on('close',     () => console.warn('⚠️  Redis: Connection closed'));
redis.on('reconnecting', () => console.warn('⚠️  Redis: Reconnecting...'));

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  console.log('✅ Redis: Connection closed on SIGTERM');
});

module.exports = redis;
