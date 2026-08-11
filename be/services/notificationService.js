const { notification, person } = require('../models');
const { notificationQueue } = require('../utils/queue');

/**
 * Creates a notification in the DB and pushes it via OneSignal if subscription ID exists.
 * @param {number} recipientId - Recipient person_id
 * @param {number|null} senderId - Sender person_id
 * @param {string} title - Notification title
 * @param {string} content - Notification content body
 * @param {string|null} url - Action URL for redirection
 */
const createNotification = async (recipientId, senderId, title, content, url = null) => {
    try {
        // Create DB record
        const newNotif = await notification.create({
            notificate_to: recipientId,
            sender_id: senderId,
            title,
            content,
            url,
            is_read: false,
            created_at: new Date()
        });
        const recipient = await person.findByPk(recipientId, { attributes: ['person_id', 'name', 'username'] });
        const recipientName = recipient ? `${recipient.name} (@${recipient.username}, ID: ${recipient.person_id})` : `ID ${recipientId}`;

        console.log(`[Notification Service] 🔔 Đã lưu DB thông báo #${newNotif.notification_id} cho User: ${recipientName} | Tiêu đề: "${title}"`);

        // Fetch all active subscription IDs for the recipient
        const { push_subscription } = require('../models');
        const subs = await push_subscription.findAll({
            where: { person_id: recipientId }
        });
        
        const subscriptionIds = subs.map(sub => sub.onesignal_id).filter(id => id && id.trim() !== '');

        if (subscriptionIds.length > 0) {
            console.log(`[Notification Service] 📱 Tìm thấy ${subscriptionIds.length} thiết bị cho User ${recipientName}:`);
            subscriptionIds.forEach((id, idx) => console.log(`   └─ Thiết bị #${idx + 1}: ${id}`));

            let buttons = null;
            if (url && url.includes('/history/')) {
                buttons = [
                    { id: 'approved', text: 'Đồng ý' },
                    { id: 'rejected', text: 'Từ chối' }
                ];
            }
            
            // Queue the push notification sending asynchronously
            await notificationQueue.add('send-push', {
                recipientName,
                subscriptionIds,
                title,
                content,
                url,
                buttons
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000 // 2s, 4s, 8s exponential retry
                },
                removeOnComplete: true, // Clean up completed jobs in Redis
                removeOnFail: { count: 100 } // Retain last 100 failed jobs for debugging
            }).catch(err => {
                console.error('[Notification Service] ❌ Lỗi thêm job đẩy push vào hàng đợi Queue:', err);
            });
        } else {
            console.warn(`[Notification Service] ⚠️ User ${recipientName} KHÔNG CÓ THIẾT BỊ NÀO (0 push_subscriptions) trong DB. Bỏ qua gửi Push.`);
        }

        return newNotif;
    } catch (error) {
        console.error('[Notification Service] Error creating notification:', error);
    }
};

const getNotificationsByPerson = async (personId) => {
    const list = await notification.findAll({
        where: { notificate_to: personId },
        include: [
            {
                model: person,
                as: 'sender',
                attributes: ['person_id', 'name', 'username']
            }
        ],
        order: [['created_at', 'DESC']]
    });

    const { request: requestModel } = require('../models');
    const enrichedList = [];
    for (const notif of list) {
        const notifData = notif.toJSON();
        if (notifData.url) {
            const match = notifData.url.match(/^\/history\/(\d+)$/);
            if (match) {
                const requestId = parseInt(match[1], 10);
                try {
                    const reqObj = await requestModel.findByPk(requestId, {
                        attributes: ['status']
                    });
                    if (reqObj) {
                        notifData.request_status = reqObj.status;
                        notifData.request_id = requestId;
                    }
                } catch (err) {
                    console.error('[Notification Service] Error fetching request status for ID', requestId, err);
                }
            }
        }
        enrichedList.push(notifData);
    }
    return enrichedList;
};

/**
 * Mark a single notification as read if it belongs to the person.
 */
const markAsRead = async (notificationId, personId) => {
    const notif = await notification.findOne({
        where: { notification_id: notificationId, notificate_to: personId }
    });
    if (!notif) return null;
    return await notif.update({ is_read: true });
};

/**
 * Mark all notifications of a person as read.
 */
const markAllAsRead = async (personId) => {
    return await notification.update(
        { is_read: true },
        { where: { notificate_to: personId, is_read: false } }
    );
};

module.exports = {
    createNotification,
    getNotificationsByPerson,
    markAsRead,
    markAllAsRead
};
