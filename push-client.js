/* Push client for Firebase Cloud Messaging.
   This file is inactive until firebase-config.js contains real values. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js";

const cfg = window.PERIOD_MAN_FIREBASE_CONFIG;
const vapidKey = window.PERIOD_MAN_VAPID_KEY;
if (!cfg || !vapidKey || String(cfg.apiKey || "").startsWith("YOUR_")) {
  console.info("Firebase Push: add firebase-config.js values first.");
} else {
  try {
    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const messaging = getMessaging(app);

    async function enablePush() {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");
      await signInAnonymously(auth);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token || !auth.currentUser) throw new Error("FCM token unavailable.");

      const raw = JSON.parse(localStorage.getItem("mahyar_data_v2") || "{}");
      await setDoc(doc(db, "pushSubscriptions", auth.currentUser.uid), {
        token,
        currentStart: raw.currentStart || null,
        nextPeriod: raw.nextPeriod || null,
        periodLength: Number(raw.periodLength || 7),
        cycleLength: Number(raw.cycleLength || 28),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        notificationHour: 9,
        appUrl: location.origin + location.pathname,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    }

    window.enableFirebasePush = enablePush;
    onMessage(messaging, (payload) => console.log("Push received", payload));
  } catch (e) {
    console.warn("Firebase Push init failed:", e);
  }
}
