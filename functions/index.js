/**
 * Firebase Cloud Functions for Eskiz.uz SMS integration.
 * Deploy via: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Helper to fetch Eskiz Token.
 * Requires config set via: 
 * firebase functions:config:set eskiz.email="your@email.com" eskiz.password="yourpassword"
 */
async function getEskizToken() {
  const email = functions.config().eskiz.email;
  const password = functions.config().eskiz.password;

  const response = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Eskiz Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.token;
}

/**
 * Helper to send SMS
 */
async function sendSMS(phone, message, userId, type) {
  try {
    const token = await getEskizToken();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const response = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile_phone: cleanPhone,
        message: message,
        from: "4546"
      })
    });

    const success = response.ok;
    
    // Log
    await db.collection("sms_logs").add({
      userId,
      phone,
      message,
      type,
      sentAt: Date.now(),
      success
    });

  } catch (error) {
    console.error("SMS Error:", error);
    await db.collection("sms_logs").add({
      userId,
      phone,
      message,
      type,
      sentAt: Date.now(),
      success: false,
      error: String(error)
    });
  }
}

/**
 * Trigger: Attendance
 */
exports.onAttendanceMarked = functions.firestore
  .document("attendance/{attendanceId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Fetch User
    const userDoc = await db.collection("users").doc(data.userId).get();
    if (!userDoc.exists) return;
    const user = userDoc.data();

    // Fetch Config
    const configDoc = await db.collection("adminConfig").doc("main").get();
    const config = configDoc.exists ? configDoc.data() : { centerName: "O'quv Markazi", smsEnabled: false };

    if (!config.smsEnabled) return;

    let message = "";
    if (data.status === "present") {
      message = `Hurmatli ota-ona, farzandingiz ${user.fullName} bugun darsga keldi va qatnashmoqda. ${data.date} ${config.centerName}`;
    } else if (data.status === "absent") {
      message = `Hurmatli ota-ona, farzandingiz ${user.fullName} bugun darsga kelmadi. ${data.date} ${config.centerName}. Aloqa: ${config.adminPhone || ''}`;
    }

    if (message && user.phone) {
      await sendSMS(user.phone, message, data.userId, "attendance");
    }
  });

/**
 * Trigger: Payments
 */
exports.onPaymentMarked = functions.firestore
  .document("payments/{paymentId}")
  .onWrite(async (change, context) => {
    // Only trigger if marked paid
    const data = change.after.data();
    const prevData = change.before.data();

    if (!data) return; // Deleted
    
    // Check if status changed TO paid
    const justPaid = data.status === "paid" && (!prevData || prevData.status !== "paid");
    if (!justPaid) return;

    // Fetch User
    const userDoc = await db.collection("users").doc(data.userId).get();
    if (!userDoc.exists) return;
    const user = userDoc.data();

    // Fetch Config
    const configDoc = await db.collection("adminConfig").doc("main").get();
    const config = configDoc.exists ? configDoc.data() : { centerName: "O'quv Markazi", smsEnabled: false };

    if (!config.smsEnabled) return;

    const message = `Hurmatli ${user.fullName}, ${data.month} oyi uchun to'lovingiz qabul qilindi. Rahmat! ${config.centerName}`;

    if (message && user.phone) {
      await sendSMS(user.phone, message, data.userId, "payment");
    }
  });
