'use client';

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const STORAGE_KEY = 'podcast-push-subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}

export default function NotificationBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      // Check existing subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
          if (sub) localStorage.setItem(STORAGE_KEY, 'true');
        });
      });
    }
  }, []);

  const toggleSubscription = useCallback(async () => {
    if (!isSupported || isLoading) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Notify backend
          try {
            await fetch('/api/push/unsubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            });
          } catch { /* best effort */ }
        }
        localStorage.removeItem(STORAGE_KEY);
        setIsSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setIsLoading(false);
          return;
        }

        if (!VAPID_PUBLIC_KEY) {
          console.warn('VAPID public key not configured');
          setIsLoading(false);
          return;
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        });

        // Send subscription to backend
        try {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          });
        } catch { /* best effort — store locally */ }

        localStorage.setItem(STORAGE_KEY, 'true');
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Push subscription error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed, isSupported, isLoading]);

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleSubscription}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 text-xs transition-colors ${
        isSubscribed
          ? 'text-[#e8834a] hover:text-[#cc6f3a]'
          : 'text-[#666] hover:text-[#e8834a]'
      }`}
      title={isSubscribed ? 'Notifications activées — cliquer pour désactiver' : 'Activer les notifications'}
    >
      {isLoading ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
          <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill={isSubscribed ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2">
          <path d="M7 1.5A3.5 3.5 0 003.5 5v2.5L2 9h10L10.5 7.5V5A3.5 3.5 0 007 1.5z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 9v.5a1.5 1.5 0 003 0V9" strokeLinecap="round"/>
        </svg>
      )}
      <span>{isSubscribed ? 'Notifications ON' : 'Notifications'}</span>
    </button>
  );
}
