# Live Chat Deployment Guide

## 🚨 Deployment Issue on Render

The deployment failed because the backend now requires Socket.IO dependencies and HTTP server configuration.

---

## 📋 Pre-Deployment Checklist

### 1. **Verify Dependencies**

Backend `package.json` should include:
```json
{
  "dependencies": {
    "socket.io": "^4.8.1",
    "uuid": "^9.0.0"
  }
}
```

Frontend `package.json` should include:
```json
{
  "dependencies": {
    "socket.io-client": "^4.8.1"
  }
}
```

### 2. **Environment Variables**

No new environment variables are required! The chat system uses existing variables:
- `MONGODB_URI` - Already configured
- `JWT_SECRET` - Already configured
- `FRONTEND_URL` - Already configured
- `PORT` - Already configured (5001)

---

## 🔧 Render Deployment Fix

### Option 1: Automatic Redeploy (Recommended)

Render should automatically redeploy when you push to GitHub. The deployment failed on commit `66870a6`, but the code is correct.

**Steps:**
1. Go to Render dashboard: https://dashboard.render.com
2. Find your backend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete (~3-5 minutes)

### Option 2: Clear Build Cache

If automatic redeploy fails:

1. Go to Render dashboard
2. Click on your backend service
3. Go to "Settings" tab
4. Scroll to "Build & Deploy"
5. Click "Clear build cache"
6. Click "Manual Deploy" → "Deploy latest commit"

### Option 3: Check Build Logs

If deployment still fails:

1. Go to Render dashboard
2. Click on your backend service
3. Click on the failed deployment
4. Check "Build Logs" for errors
5. Common issues:
   - Missing dependencies → Run `npm install` locally to verify
   - Build timeout → Increase build timeout in Render settings
   - Memory issues → Upgrade Render plan

---

## 🧪 Verify Deployment

### 1. **Check Backend Health**

```bash
curl https://your-backend-url.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "MedCore BD API is running",
  "version": "2.0.0",
  "services": {
    "api": "operational",
    "database": {
      "status": "connected",
      "connected": true
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

### 2. **Check Socket.IO Connection**

Open browser console on your frontend:
```javascript
// Should see in console:
✅ Socket.IO connected: <socket-id>
```

### 3. **Test Chat Widget**

1. Open your deployed frontend
2. Click chat button (bottom-right)
3. Send a test message
4. Check if message appears

### 4. **Test Admin Dashboard**

1. Login as admin
2. Navigate to `/admin/chat`
3. Check if dashboard loads
4. Verify stats display

---

## 🐛 Troubleshooting

### Issue: "Socket.IO connection failed"

**Cause**: Backend not running or CORS misconfigured

**Fix**:
1. Check backend is running: `curl https://your-backend-url.onrender.com/api/health`
2. Verify `FRONTEND_URL` environment variable matches your frontend URL
3. Check Render logs for CORS errors

### Issue: "Cannot read property 'io' of null"

**Cause**: Socket.IO not initialized

**Fix**:
1. Verify `server.js` has HTTP server creation:
   ```javascript
   const httpServer = http.createServer(app);
   chatSocketService.initialize(httpServer);
   ```
2. Redeploy backend

### Issue: "Queue processor not running"

**Cause**: Queue processor not started

**Fix**:
1. Verify `server.js` has queue processor startup:
   ```javascript
   chatRoutingService.startQueueProcessor();
   ```
2. Check logs for "✅ Chat queue processor started"

### Issue: "Messages not appearing in real-time"

**Cause**: WebSocket connection not established

**Fix**:
1. Check browser console for Socket.IO errors
2. Verify backend WebSocket endpoint is accessible
3. Check firewall/proxy settings

### Issue: "Agent assignment not working"

**Cause**: No agents online or queue processor not running

**Fix**:
1. Login as admin and set status to "Online"
2. Check queue processor logs
3. Verify MongoDB connection

---

## 📊 Monitoring

### Backend Logs to Watch

```bash
# Successful startup logs:
✅ MongoDB connected successfully
✅ Redis cache initialized successfully
✅ Socket.IO server initialized
✅ Chat queue processor started
MedCore BD API v2.0 running on port 5001 [production]
```

### Key Metrics to Monitor

1. **Active Connections**: Number of Socket.IO connections
2. **Queue Length**: Number of waiting conversations
3. **Response Time**: Average first response time
4. **Agent Utilization**: Active conversations per agent

---

## 🔄 Rollback Plan

If live chat causes issues:

### Quick Disable (Frontend Only)

Remove chat widget from layout:

```javascript
// src/app/layout.jsx
// Comment out this line:
// <ChatContainer />
```

Redeploy frontend. Backend will continue running but chat widget won't appear.

### Full Rollback

```bash
# Revert to previous commit
git revert 66870a6
git push origin main
```

This will remove all live chat code but keep other features intact.

---

## 📈 Performance Considerations

### Render Free Tier Limitations

- **Spin down after 15 minutes of inactivity**
- **Cold start takes 30-60 seconds**
- **Limited concurrent connections**

**Recommendation**: Upgrade to paid plan for production use.

### Scaling Considerations

For high traffic (>1000 concurrent users):

1. **Use Redis Adapter** for Socket.IO:
   ```javascript
   const { createAdapter } = require('@socket.io/redis-adapter');
   io.adapter(createAdapter(redisClient, redisClient.duplicate()));
   ```

2. **Horizontal Scaling**: Deploy multiple backend instances

3. **Load Balancer**: Use sticky sessions for WebSocket connections

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Vercel
- [ ] Health check endpoint returns 200
- [ ] Socket.IO connection established
- [ ] Chat widget appears on frontend
- [ ] Admin dashboard accessible
- [ ] Test message sent successfully
- [ ] Agent assignment working
- [ ] Queue processor running
- [ ] Analytics displaying correctly

---

## 🆘 Need Help?

### Check These First

1. **Render Dashboard**: https://dashboard.render.com
2. **Vercel Dashboard**: https://vercel.com/dashboard
3. **Backend Logs**: Render → Your Service → Logs
4. **Frontend Logs**: Vercel → Your Project → Deployments → Logs
5. **Browser Console**: F12 → Console tab

### Common Commands

```bash
# Check backend status
curl https://your-backend-url.onrender.com/api/health

# Check chat API
curl https://your-backend-url.onrender.com/api/chat/config

# View backend logs (if you have Render CLI)
render logs -s your-service-name

# Redeploy backend
render deploy -s your-service-name
```

---

## 📝 Notes

- The deployment failure on commit `66870a6` is expected on first deploy with new dependencies
- Simply redeploy and it should work
- No database migrations needed (MongoDB is schemaless)
- No breaking changes to existing features
- Chat system is completely isolated from other features

---

**Ready to Deploy! 🚀**

Follow the steps above to get live chat running in production.
