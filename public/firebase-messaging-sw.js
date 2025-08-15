// Firebase messaging service worker for PropSwipes
// This file handles background push notifications

console.log('🔥 Firebase Messaging Service Worker loaded');

// Handle background messages
self.addEventListener('message', (event) => {
  console.log('🔥 Received message in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push events (background notifications)
self.addEventListener('push', (event) => {
  console.log('🔥 Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('🔥 Push data:', data);

    const notificationTitle = data.notification?.title || 'PropSwipes';
    const notificationOptions = {
      body: data.notification?.body || 'You have a new notification',
      icon: '/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png',
      badge: '/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png',
      tag: 'propswipes-notification',
      data: data.data || {},
      actions: data.data?.type === 'message' ? [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png'
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        }
      ] : [],
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('🔥 Error parsing push data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('PropSwipes', {
        body: 'You have a new notification',
        icon: '/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png',
        badge: '/lovable-uploads/810531b2-e906-42de-94ea-6dc60d4cd90c.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔥 Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  let targetUrl = '/';
  
  if (data.type === 'message' && data.matchId) {
    targetUrl = `/chat/${data.matchId}`;
  }
  
  if (action === 'reply') {
    // For now, just open the chat page
    // In a more advanced implementation, you could open a quick reply interface
    targetUrl = `/chat/${data.matchId}`;
  } else if (action === 'view') {
    targetUrl = `/chat/${data.matchId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

console.log('🔥 Service worker setup complete');