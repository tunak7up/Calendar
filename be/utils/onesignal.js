const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Sends a push notification via OneSignal
 * @param {string|string[]} targetOnesignalIds - Target user's OneSignal subscription ID(s)
 * @param {string} title - Notification heading
 * @param {string} message - Notification body
 * @param {string} [url] - Optional click URL
 */
const sendPushNotification = async (targetOnesignalIds, title, message, url = null, buttons = null, recipientName = '') => {
  if (!targetOnesignalIds) return;

  const ids = (Array.isArray(targetOnesignalIds) ? targetOnesignalIds : [targetOnesignalIds])
    .filter(id => id && id.trim() !== '');

  if (ids.length === 0) return;

  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] ⚠️ Missing ONESIGNAL_APP_ID in environment variables. Skip sending push notification.');
    return;
  }

  if (!ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] ⚠️ Missing ONESIGNAL_REST_API_KEY in environment variables. Skip sending push notification.');
    return;
  }

  // Ensure the click URL is absolute so it opens correctly in the browser
  let targetUrl = url;
  if (targetUrl && typeof targetUrl === 'string') {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const baseUrl = process.env.FRONTEND_URL;
      targetUrl = `${baseUrl.replace(/\/$/, '')}/${targetUrl.replace(/^\//, '')}`;
    }
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
        url: targetUrl,
        buttons: buttons || undefined,
        priority: 10, // High priority to bypass Android Doze mode & power saver
        ttl: 2419200 // 28 days TTL to retry if device offline
      })
    });

    const data = await response.json();
    if (response.ok && !data.errors) {
      console.log(`[OneSignal] ✅ ĐÃ GỬI THÀNH CÔNG cho ${recipientName || 'User'} | OneSignal Notification ID: ${data.id} | Số thiết bị nhận được: ${data.recipients || ids.length}`);
    } else {
      console.error(`[OneSignal] ❌ KẾT QUẢ GỬI CÓ LỖI cho ${recipientName || 'User'}:`, data);
    }
    return data;
  } catch (error) {
    console.error(`[OneSignal] ❌ Lỗi kết nối API OneSignal khi gửi cho ${recipientName || 'User'}:`, error);
  }
};

module.exports = {
  sendPushNotification
};
