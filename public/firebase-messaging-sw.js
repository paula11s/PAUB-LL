importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Para inicializar en el Service Worker, necesitamos copiar la config.
// Lo ideal es tener las variables aquí, pero en este caso de MVP podemos intentar
// escuchar los mensajes en background.

// Atención: Para que esto funcione en producción real, debes pasar tu config aquí.
// Simplemente inicializamos con una config vacía o genérica para permitir que el script compile.
// En un caso real debes reemplazar esto con tu firebaseConfig.
firebase.initializeApp({
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
