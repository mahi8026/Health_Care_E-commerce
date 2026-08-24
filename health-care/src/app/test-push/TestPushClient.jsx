'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function TestPushClient() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({});

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    if (process.env.NODE_ENV === 'development') console.log(`[${timestamp}] ${message}`);
  };

  const runDiagnostics = useCallback(async () => {
    addLog('🔍 Starting Push Notification Diagnostics...', 'info');
    
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setStatus(prev => ({ ...prev, browserSupport: supported }));
    addLog(`Browser Support: ${supported ? '✅ YES' : '❌ NO'}`, supported ? 'success' : 'error');
    if (!supported) return;

    const hasVapidKey = !!VAPID_PUBLIC_KEY;
    setStatus(prev => ({ ...prev, vapidKey: hasVapidKey }));
    addLog(`VAPID Key: ${hasVapidKey ? '✅ Configured' : '❌ Missing'}`, hasVapidKey ? 'success' : 'error');
    if (!hasVapidKey) return;
    addLog(`  → Key: ${VAPID_PUBLIC_KEY.substring(0, 30)}...`, 'info');

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      setStatus(prev => ({ ...prev, serviceWorker: !!reg }));
      if (reg) {
        addLog(`✅ Service Worker: Registered`, 'success');
        addLog(`  → Scope: ${reg.scope}`, 'info');
        addLog(`  → Active: ${reg.active ? 'YES' : 'NO'}`, reg.active ? 'success' : 'warning');
      } else {
        addLog(`⚠️ Service Worker: Not registered yet`, 'warning');
      }
    } catch (err) {
      addLog(`❌ Service Worker Error: ${err.message}`, 'error');
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(prev => ({ ...prev, subscription: !!sub }));
      if (sub) {
        addLog(`✅ Push Subscription: Already subscribed`, 'success');
        addLog(`  → Endpoint: ${sub.endpoint.substring(0, 50)}...`, 'info');
      } else {
        addLog(`ℹ️ Push Subscription: Not subscribed yet`, 'info');
      }
    } catch (err) {
      addLog(`❌ Subscription Check Error: ${err.message}`, 'error');
    }

    const permission = Notification.permission;
    setStatus(prev => ({ ...prev, permission }));
    addLog(`Permission: ${permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⚠️'} ${permission.toUpperCase()}`,
      permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'warning');

    try {
      addLog(`🌐 Testing backend connectivity to ${API}/push/subscribe...`, 'info');
      const testRes = await fetch(`${API}/push/subscribe`, { method: 'OPTIONS' });
      addLog(`✅ Backend reachable (status: ${testRes.status})`, 'success');
    } catch (err) {
      addLog(`❌ Backend unreachable: ${err.message}`, 'error');
      setStatus(prev => ({ ...prev, backend: false }));
    }

    addLog('✅ Diagnostics complete', 'success');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runDiagnostics(), 0);
    return () => clearTimeout(timer);
  }, [runDiagnostics]);

  const testSubscribe = async () => {
    addLog('🚀 Testing push subscription...', 'info');
    try {
      addLog('Requesting notification permission...', 'info');
      const permission = await Notification.requestPermission();
      addLog(`Permission result: ${permission}`, permission === 'granted' ? 'success' : 'error');
      if (permission !== 'granted') { addLog('❌ Permission denied by user', 'error'); return; }

      addLog('Getting service worker registration...', 'info');
      const reg = await navigator.serviceWorker.ready;
      addLog(`✅ Service worker ready`, 'success');

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      addLog(`✅ VAPID key converted`, 'success');

      addLog('Subscribing to push manager...', 'info');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      addLog(`✅ Push subscription successful!`, 'success');
      addLog(`  → Endpoint: ${sub.endpoint.substring(0, 80)}...`, 'info');

      addLog('Sending subscription to backend...', 'info');
      const subJSON = sub.toJSON();
      const res = await fetch(`${API}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: { endpoint: subJSON.endpoint, keys: { p256dh: subJSON.keys.p256dh, auth: subJSON.keys.auth } },
          device: 'desktop', browser: 'Test', os: 'Test',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ Backend saved subscription successfully!`, 'success');
      } else {
        addLog(`❌ Backend error: ${data.message}`, 'error');
      }
    } catch (err) {
      addLog(`❌ Subscribe failed: ${err.name} - ${err.message}`, 'error');
    }
  };

  const testUnsubscribe = async () => {
    addLog('🗑️ Testing unsubscribe...', 'info');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await sub.unsubscribe(); addLog('✅ Unsubscribed successfully', 'success'); }
      else { addLog('ℹ️ No subscription to remove', 'info'); }
    } catch (err) { addLog(`❌ Unsubscribe error: ${err.message}`, 'error'); }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-6">🔔 Push Notification Diagnostics</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'browserSupport', label: 'Browser Support' },
              { key: 'vapidKey', label: 'VAPID Key' },
              { key: 'serviceWorker', label: 'Service Worker' },
              { key: 'subscription', label: 'Subscribed' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${status[key] ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span>{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${status.permission === 'granted' ? 'bg-green-400' : status.permission === 'denied' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
              <span>Permission: {status.permission || 'default'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${status.backend !== false ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>Backend</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <button onClick={testSubscribe} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">🚀 Test Subscribe</button>
          <button onClick={testUnsubscribe} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">🗑️ Unsubscribe</button>
          <button onClick={runDiagnostics} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">🔍 Re-run Diagnostics</button>
          <button onClick={clearLogs} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Clear Logs</button>
        </div>
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow p-6 font-mono text-sm max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-white">Console Logs</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-gray-400'}`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <div><strong>API URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{API}</code></div>
            <div><strong>VAPID Key:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{VAPID_PUBLIC_KEY?.substring(0, 50)}...</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
