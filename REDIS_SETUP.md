# Redis Setup Guide for Health Care Project

## Why Redis?

Redis caching provides:
- **70-90% faster API responses** for frequently accessed data
- **Reduced database load** by serving cached responses
- **Better scalability** for high-traffic scenarios
- **Automatic cache invalidation** when data changes

---

## Installation Options

### Option 1: Windows (Local Development)

#### Using WSL2 (Recommended)
```bash
# Install WSL2 if not already installed
wsl --install

# Inside WSL2
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test connection
redis-cli ping
# Should return: PONG
```

#### Using Windows Native Redis
```bash
# Download Redis for Windows
# https://github.com/microsoftarchive/redis/releases
# Download Redis-x64-3.0.504.msi

# Install and start Redis service
# Redis will run on localhost:6379 by default
```

#### Using Docker (Easiest)
```bash
# Pull Redis image
docker pull redis:latest

# Run Redis container
docker run --name health-care-redis -p 6379:6379 -d redis:latest

# Test connection
docker exec -it health-care-redis redis-cli ping
# Should return: PONG
```

---

### Option 2: Cloud Redis (Production)

#### Redis Cloud (Free Tier Available)
1. Go to https://redis.com/try-free/
2. Create account and database
3. Get connection details:
   - Host: `redis-xxxxx.cloud.redislabs.com`
   - Port: `xxxxx`
   - Password: `your-password`

#### AWS ElastiCache
```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id health-care-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

#### Azure Cache for Redis
```bash
# Create Azure Redis Cache
az redis create \
  --name health-care-redis \
  --resource-group your-resource-group \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

---

## Configuration

### Backend Environment Variables

Edit `health-care/backend/.env`:

```env
# Local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cloud Redis (example)
# REDIS_HOST=redis-12345.cloud.redislabs.com
# REDIS_PORT=12345
# REDIS_PASSWORD=your-secure-password
```

### Test Configuration

Create `health-care/backend/test-redis.js`:

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
  
  // Test set/get
  redis.set('test-key', 'Hello Redis!', 'EX', 10);
  redis.get('test-key', (err, result) => {
    console.log('Test value:', result);
    redis.quit();
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  process.exit(1);
});
```

Run test:
```bash
cd health-care/backend
node test-redis.js
```

---

## Verification

### 1. Check Redis is Running

```bash
# Local Redis
redis-cli ping
# Should return: PONG

# Docker Redis
docker exec -it health-care-redis redis-cli ping

# Cloud Redis
redis-cli -h your-host -p your-port -a your-password ping
```

### 2. Start Backend and Check Logs

```bash
cd health-care/backend
npm start
```

Look for:
```
✅ Redis connected successfully
```

### 3. Test API Caching

```bash
# First request (cache miss)
curl -i http://localhost:5000/api/categories
# Look for: X-Cache: MISS

# Second request (cache hit)
curl -i http://localhost:5000/api/categories
# Look for: X-Cache: HIT
```

### 4. Monitor Cache Keys

```bash
# Connect to Redis CLI
redis-cli

# List all keys
KEYS *

# Example output:
# 1) "categories:/api/categories"
# 2) "manufacturers:/api/manufacturers"
# 3) "products:/api/products/featured"

# Get cache value
GET "categories:/api/categories"

# Check TTL (time to live)
TTL "categories:/api/categories"
```

---

## Cache Management

### View Cache Statistics

```bash
redis-cli INFO stats
```

Look for:
- `keyspace_hits` - Number of cache hits
- `keyspace_misses` - Number of cache misses
- Hit rate = hits / (hits + misses)

### Clear All Cache

```bash
# Clear all keys
redis-cli FLUSHALL

# Clear specific pattern
redis-cli --scan --pattern "categories:*" | xargs redis-cli DEL
```

### Monitor Real-time Activity

```bash
# Watch all commands
redis-cli MONITOR

# Watch specific operations
redis-cli MONITOR | grep GET
```

---

## Performance Tuning

### Adjust Cache TTL

Edit `health-care/backend/src/routes/categoryRoutes.js`:

```javascript
// Increase TTL for rarely changing data
redisCacheMiddleware({ ttl: 3600, keyPrefix: 'categories:' })  // 1 hour

// Decrease TTL for frequently changing data
redisCacheMiddleware({ ttl: 60, keyPrefix: 'products:' })  // 1 minute
```

### Memory Management

```bash
# Check memory usage
redis-cli INFO memory

# Set max memory (example: 256MB)
redis-cli CONFIG SET maxmemory 256mb

# Set eviction policy (remove least recently used)
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Persistence Configuration

For production, enable Redis persistence:

```bash
# Enable RDB snapshots
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# Enable AOF (Append Only File)
redis-cli CONFIG SET appendonly yes
```

---

## Troubleshooting

### Problem: Connection Refused

**Symptoms:**
```
Redis Client Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**
1. Check if Redis is running: `redis-cli ping`
2. Start Redis: `sudo service redis-server start` (Linux) or `redis-server` (Windows)
3. Check firewall: Allow port 6379
4. Verify REDIS_HOST and REDIS_PORT in .env

---

### Problem: Authentication Failed

**Symptoms:**
```
Redis Client Error: NOAUTH Authentication required
```

**Solutions:**
1. Set REDIS_PASSWORD in .env
2. Check Redis config: `redis-cli CONFIG GET requirepass`
3. Test with password: `redis-cli -a your-password ping`

---

### Problem: Out of Memory

**Symptoms:**
```
Redis Client Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**
1. Increase max memory: `redis-cli CONFIG SET maxmemory 512mb`
2. Enable eviction: `redis-cli CONFIG SET maxmemory-policy allkeys-lru`
3. Clear old keys: `redis-cli FLUSHALL`

---

### Problem: Slow Performance

**Symptoms:**
- Cache hits but still slow responses
- High memory usage

**Solutions:**
1. Check slow log: `redis-cli SLOWLOG GET 10`
2. Reduce TTL for large objects
3. Use Redis pipelining for bulk operations
4. Consider Redis Cluster for scaling

---

## Production Checklist

- [ ] Redis running on dedicated server/container
- [ ] Password authentication enabled
- [ ] Firewall configured (only allow backend access)
- [ ] Persistence enabled (RDB + AOF)
- [ ] Max memory configured
- [ ] Eviction policy set
- [ ] Monitoring enabled (CloudWatch, Datadog, etc.)
- [ ] Backup strategy in place
- [ ] SSL/TLS enabled for cloud Redis
- [ ] Connection pooling configured

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Hit Rate:** Should be > 80% for cached routes
2. **Memory Usage:** Should be < 80% of max memory
3. **Connection Count:** Monitor for connection leaks
4. **Eviction Count:** High evictions = need more memory
5. **Latency:** Should be < 1ms for local, < 10ms for cloud

### Set Up Alerts

```bash
# Example: Alert if hit rate < 70%
# (Implement in your monitoring tool)

# Check hit rate
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
```

---

## Cost Optimization

### Free Tiers

- **Redis Cloud:** 30MB free
- **AWS ElastiCache:** Free tier with t2.micro
- **Azure Cache:** No free tier, but pay-as-you-go

### Reduce Costs

1. Use shorter TTLs to reduce memory usage
2. Cache only frequently accessed data
3. Use compression for large objects
4. Scale down during off-peak hours
5. Use reserved instances for production

---

## Next Steps

1. ✅ Install Redis (choose option above)
2. ✅ Configure environment variables
3. ✅ Test connection with test-redis.js
4. ✅ Start backend and verify logs
5. ✅ Test API caching with curl
6. ✅ Monitor cache hit rates
7. ✅ Adjust TTLs based on usage patterns
8. ✅ Set up production Redis with persistence

---

**Need Help?**
- Redis Documentation: https://redis.io/docs/
- Redis Cloud Support: https://redis.com/support/
- Project Issues: Check backend logs and `OPTIMIZATION_QUICK_GUIDE.md`
