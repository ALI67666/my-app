

// 'use strict';

// const STATIC_CACHE_NAME = 'site-static-v26';
// const DYNAMIC_CACHE_NAME = 'site-dynamic-v26';
// const APP_SHELL_ASSETS = [
//   '/',
//   '/manifest.json',
//   '/favicon.ico',
//   '/icons/icon-192x192.png',
//   '/fonts/HafsSmart_08.ttf'
// ];

// // 🧹 دالة لتحديد حجم الكاش (مثلاً 50 عنصر بس)
// const limitCacheSize = async (name, maxItems) => {
//   const cache = await caches.open(name);
//   const keys = await cache.keys();
//   if (keys.length > maxItems) {
//     await cache.delete(keys[0]);
//     limitCacheSize(name, maxItems);
//   }
// };

// // 📥 INSTALL: تخزين الملفات الأساسية
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(STATIC_CACHE_NAME)
//       .then(cache => cache.addAll(APP_SHELL_ASSETS))
//       .then(() => self.skipWaiting())
//   );
// });

// // 🔄 ACTIVATE: مسح الكاش القديم
// self.addEventListener('activate', event => {
//   event.waitUntil(
//     caches.keys().then(keys =>
//       Promise.all(
//         keys
//           .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
//           .map(key => caches.delete(key))
//       )
//     ).then(() => self.clients.claim())
//   );
// });

// // 🌐 FETCH: إستراتيجية cache with network fallback
// self.addEventListener('fetch', event => {
//   if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) return;

//   event.respondWith(
//     caches.match(event.request).then(cachedResponse => {
//       if (cachedResponse) {
//         // ✅ لو موجود في الكاش رجعه
//         return cachedResponse;
//       }

//       // 🌐 لو مش موجود → حاول تجيبه من الشبكة
//       return fetch(event.request).then(networkResponse => {
//         // نخزن الرد بس لو status = 200 أو 206
//         if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
//           const responseToCache = networkResponse.clone();
//           caches.open(DYNAMIC_CACHE_NAME).then(cache => {
//             cache.put(event.request, responseToCache);
//             limitCacheSize(DYNAMIC_CACHE_NAME, 550); // حدد الحد الأقصى 50 عنصر
//           });
//         }
//         return networkResponse;
//       }).catch(() => {
//         // ❌ في حالة الأوفلاين ومافيش نسخة مخزنة
//         if (event.request.destination === 'document') {
//           return caches.match('/'); // fallback للصفحة الرئيسية
//         }
//         return new Response("❌ Offline ولم يتم العثور على نسخة في الكاش");
//       });
//     })
//   );
// });





// self.addEventListener('push', event => {
//   const data = event.data.json();
//   console.log('Push notification received', data);
//   const options = {
//     body: data.body,
//     icon: '/icons/icon-192x192.png',
//     badge: '/icons/icon-72x72.png',
//     data: { url: data.url }  // ✨ هنا
//   };
//   event.waitUntil(
//     self.registration.showNotification(data.title, options)
//   );
// });


// // 👂 التعامل مع الضغط على البطاقة
// self.addEventListener('notificationclick', event => {
//   event.notification.close();

//   const targetUrl = event.notification.data?.url || '/'; // لو مفيش url يرجع للهوم

//   event.waitUntil(
//     clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
//       for (const client of clientList) {
//         if (client.url.includes(targetUrl) && 'focus' in client) {
//           return client.focus();
//         }
//       }
//       if (clients.openWindow) {
//         return clients.openWindow(targetUrl);
//       }
//     })
//   );
// });



'use strict';

// قمنا بتحديث الإصدار لكي يجبر المتصفح على تحديث الـ Service Worker
const STATIC_CACHE_NAME = 'site-static-v27'; 
const DYNAMIC_CACHE_NAME = 'site-dynamic-v27';
const APP_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/fonts/HafsSmart_08.ttf'
];

// 🧹 دالة لتحديد حجم الكاش
const limitCacheSize = async (name, maxItems) => {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(name, maxItems);
  }
};

// 📥 INSTALL: تخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 🔄 ACTIVATE: مسح الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          // ✨ استثناء كاش المصحف من المسح (mushaf-pages-cache)
          .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME && key !== 'mushaf-pages-cache')
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 🌐 FETCH: إستراتيجية cache with network fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) return;

  // 🔴 الحل الجذري لمشكلة ملفات الصوت 🔴
  // إذا كان الطلب يطلب "جزء" من ملف صوت (Range request)، نتركه يمر للشبكة مباشرة 
  // ولا نتدخل فيه بالـ Service Worker لتجنب أخطاء 206 ومشاكل تشغيل الصوت.
  if (event.request.headers.has('range')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // ✅ لو موجود في الكاش رجعه
        return cachedResponse;
      }

      // 🌐 لو مش موجود → حاول تجيبه من الشبكة
      return fetch(event.request).then(networkResponse => {
        // 🔴 التعديل هنا: نخزن الرد فقط وفقط إذا كان 200 (ملف كامل) 🔴
        // ممنوع منعاً باتاً تخزين 206
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
            limitCacheSize(DYNAMIC_CACHE_NAME, 500); 
          });
        }
        return networkResponse;
      }).catch(() => {
        // ❌ في حالة الأوفلاين ومافيش نسخة مخزنة
        if (event.request.destination === 'document') {
          return caches.match('/'); // fallback للصفحة الرئيسية
        }
        // إرجاع رد وهمي لتجنب كسر التطبيق
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});

// 🔔 التعامل مع الإشعارات (Push)
self.addEventListener('push', event => {
  const data = event.data.json();
  console.log('Push notification received', data);
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url }  
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 👂 التعامل مع الضغط على إشعار الويب
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/'; 

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});