/**
 * OneSignal Service Worker
 *
 * OneSignal SDK automatically registers and updates this file.
 * It must be served from the root of the site at /OneSignalSDKWorker.js
 * Do NOT merge this with sw.js — keep them separate to prevent crashes.
 *
 * Chrome requires message event listeners to be added during initial
 * evaluation (synchronously). OneSignal's SDK adds its listener
 * asynchronously, which triggers a console warning. We add a sync
 * listener here to avoid that warning and ensure message forwarding works.
 */
self.addEventListener('message', function () {
  /* Chrome requires a synchronous message handler in the service worker.
     OneSignal's SDK will handle the actual message processing. */
});
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
