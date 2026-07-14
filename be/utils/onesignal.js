const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Sends a push notification via OneSignal
 * @param {string|string[]} targetOnesignalIds - Target user's OneSignal subscription ID(s)
 * @param {string} title - Notification heading
 * @param {string} message - Notification body
 * @param {string} [url] - Optional click URL
 */
const sendPushNotification = async (targetOnesignalIds, title, message, url = null) => {
  if (!targetOnesignalIds) return;
  
  const ids = (Array.isArray(targetOnesignalIds) ? targetOnesignalIds : [targetOnesignalIds])
    .filter(id => id && id.trim() !== '');

  if (ids.length === 0) return;

  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] Missing ONESIGNAL_APP_ID in environment variables. Skip sending push notification.');
    return;
  }

  if (!ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] Missing ONESIGNAL_REST_API_KEY in environment variables. Skip sending push notification.');
    return;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: ids,
        headings: { en: title, vi: title },
        contents: { en: message, vi: message },
        url: url
      })
    });
    
    const data = await response.json();
    console.log('[OneSignal] Push notification response:', data);
    return data;
  } catch (error) {
    console.error('[OneSignal] Error sending push notification:', error);
  }
};

module.exports = {
  sendPushNotification
};
