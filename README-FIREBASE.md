# پریود من — نسخه Push Notification

این پوشه برای اضافه کردن اعلان واقعی حتی وقتی سایت بسته یا در پس‌زمینه است آماده شده است.

## فایل‌های جدید
- `firebase-config.example.js` — قالب تنظیمات Firebase برای مرورگر
- `firebase-messaging-sw.js` — سرویس‌ورکر اعلان‌های FCM در حالت پس‌زمینه
- `functions/index.js` — زمان‌بندی و ارسال اعلان‌های روزانه
- `functions/package.json` — وابستگی‌های Cloud Functions
- `firestore.rules` — قوانین دسترسی توکن‌ها
- `firebase.json` — تنظیمات Firebase

## راه‌اندازی
1. در Firebase یک پروژه بساز و یک Web App ثبت کن. طبق مستندات رسمی، بعد از ثبت Web App تنظیمات `firebaseConfig` را می‌گیری. 
2. Cloud Messaging را فعال کن و از Project settings > Cloud Messaging > Web Push certificates یک VAPID public key بساز.
3. `firebase-config.example.js` را به `firebase-config.js` تغییر نام بده و مقادیر Firebase و VAPID را وارد کن.
4. همان Firebase config را داخل `firebase-messaging-sw.js` نیز قرار بده.
5. Firebase Authentication را برای Anonymous sign-in فعال کن.
6. Firestore Database را بساز.
7. از ریشه پروژه `npm install -g firebase-tools` و سپس `firebase login` انجام بده.
8. داخل پوشه پروژه `firebase init` لازم نیست؛ فایل‌های `firebase.json` و `firestore.rules` از قبل آماده‌اند. فقط پروژه را با `firebase use --add` به پروژه Firebase خودت وصل کن.
9. داخل `functions` دستور `npm install` را اجرا کن.
10. سپس `firebase deploy --only functions,firestore` را اجرا کن.

## نکته مهم
برای ارسال Push، خود اپ باید توکن FCM دستگاه را بگیرد و آن را در Firestore در مسیر `pushSubscriptions/{uid}` ذخیره کند. در مرحله بعد باید `app.js` به Firebase Auth + Messaging متصل شود؛ این بخش عمداً جدا نگه داشته شده تا قبل از وارد کردن config شخصی، کلیدها داخل کد اشتباه ثبت نشوند.

FCM Web به HTTPS و Service Worker نیاز دارد. GitHub Pages از HTTPS استفاده می‌کند، بنابراین برای بخش وب مناسب است.
