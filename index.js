const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

function isoDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, d));
  x.setUTCDate(x.getUTCDate() + days);
  return x.toISOString().slice(0, 10);
}

exports.sendPeriodReminders = onSchedule({
  schedule: "every 60 minutes",
  timeZone: "UTC",
  region: "us-central1",
  memory: "256MiB"
}, async () => {
  const snap = await db.collection("pushSubscriptions").get();
  const now = new Date();
  const stale = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.token || !data.nextPeriod) continue;

    const today = isoDateInTimeZone(now, data.timeZone || "UTC");
    const preferredHour = Number(data.notificationHour ?? 9);
    const currentHour = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: data.timeZone || "UTC", hour: "2-digit", hour12: false
    }).format(now));
    if (currentHour !== preferredHour) continue;

    const periodLength = Number(data.periodLength || 7);
    const periodEnd = data.currentStart ? addDays(data.currentStart, periodLength - 1) : null;
    let title = null;
    let body = null;
    let key = null;

    if (data.currentStart && today >= data.currentStart && today <= periodEnd) {
      const day = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.currentStart}T00:00:00Z`)) / 86400000) + 1;
      title = `روز ${day} پریود 🌷`;
      body = day === 1 ? "امروز روز اوله؛ آروم‌تر پیش برو و به بدنت فرصت بده." : `امروز روز ${day} ـه؛ حواست به آب، استراحت و حال خودت باشه.`;
      key = `period-day-${today}`;
    } else if (today === periodEnd && !data.endReminderSentFor?.includes(periodEnd)) {
      title = "پریود من 🌙";
      body = "این دوره طبق تاریخی که ثبت کردی به روز پایانی رسیده. اگر هنوز ادامه داره، عدد مدت پریودت رو بررسی کن.";
      key = `end-${periodEnd}`;
    } else if (today === data.nextPeriod) {
      title = "پریود من 👀";
      body = "امروز موعد تقریبی پریودته. پریود شدی؟ اگر شروع شده، داخل برنامه ثبتش کن.";
      key = `due-${today}`;
    }

    if (!title || data.lastSentKey === key) continue;

    try {
      await getMessaging().send({
        token: data.token,
        notification: { title, body },
        data: { title, body, url: data.appUrl || "/" },
        webpush: { fcmOptions: { link: data.appUrl || "/" } }
      });
      await doc.ref.update({ lastSentKey: key, lastSentAt: new Date().toISOString() });
    } catch (err) {
      const code = err?.errorInfo?.code || "";
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        stale.push(doc.ref);
      }
    }
  }

  await Promise.all(stale.map(ref => ref.delete()));
});
