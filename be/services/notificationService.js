const { notification, person, request: requestModel, push_subscription } = require('../models');
const { Op } = require('sequelize');
const { notificationQueue } = require('../utils/queue');
const sseManager = require('../utils/sseManager');

/**
 * Creates a notification in the DB and pushes it via SSE Realtime & OneSignal.
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

        let senderInfo = null;
        if (senderId) {
            senderInfo = await person.findByPk(senderId, { attributes: ['person_id', 'name', 'username'] });
        }

        console.log(`[Notification Service] 🔔 Đã lưu DB thông báo #${newNotif.notification_id} cho User: ${recipientName} | Tiêu đề: "${title}"`);

        // Chuẩn bị payload thông báo phong phú để gửi SSE Realtime
        const notifData = newNotif.toJSON();
        notifData.sender = senderInfo ? senderInfo.toJSON() : null;

        if (url) {
            const match = url.match(/^\/history\/(\d+)$/);
            if (match) {
                const requestId = parseInt(match[1], 10);
                try {
                    const reqObj = await requestModel.findByPk(requestId, { attributes: ['status'] });
                    if (reqObj) {
                        notifData.request_status = reqObj.status;
                        notifData.request_id = requestId;
                    }
                } catch (err) {
                    console.error('[Notification Service] Error fetching request status for ID', requestId, err);
                }
            }
        }

        // 1. Phát sự kiện Realtime SSE trực tiếp tới trình duyệt người nhận (0ms delay)
        sseManager.sendToUser(recipientId, 'new_notification', notifData);

        // 2. Fetch active subscription IDs và đẩy push notification qua OneSignal / Queue
        const subs = await push_subscription.findAll({
            where: { person_id: recipientId }
        });
        
        const subscriptionIds = subs.map(sub => sub.onesignal_id).filter(id => id && id.trim() !== '');

        if (subscriptionIds.length > 0) {
            console.log(`[Notification Service] 📱 Tìm thấy ${subscriptionIds.length} thiết bị cho User ${recipientName}:`);

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
                    delay: 2000
                },
                removeOnComplete: true,
                removeOnFail: { count: 100 }
            }).catch(err => {
                console.error('[Notification Service] ❌ Lỗi thêm job đẩy push vào hàng đợi Queue:', err);
            });
        }

        return newNotif;
    } catch (error) {
        console.error('[Notification Service] Error creating notification:', error);
    }
};

/**
 * Lấy danh sách thông báo của người dùng kèm phân trang và tối ưu hóa N+1 query
 */
const getNotificationsByPerson = async (personId, options = {}) => {
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const offset = options.offset ? parseInt(options.offset, 10) : 0;

    const list = await notification.findAll({
        where: { notificate_to: personId },
        include: [
            {
                model: person,
                as: 'sender',
                attributes: ['person_id', 'name', 'username']
            }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
    });

    const enrichedList = list.map(n => n.toJSON());

    // 1. Gom tất cả request_id từ các URL dạng /history/:id
    const requestIds = [];
    for (const notif of enrichedList) {
        if (notif.url) {
            const match = notif.url.match(/^\/history\/(\d+)$/);
            if (match) {
                requestIds.push(parseInt(match[1], 10));
            }
        }
    }

    // 2. Query 1 lần duy nhất với Op.in (Triệt tiêu hoàn toàn N+1 query)
    if (requestIds.length > 0) {
        try {
            const requests = await requestModel.findAll({
                where: {
                    request_id: {
                        [Op.in]: requestIds
                    }
                },
                attributes: ['request_id', 'status']
            });

            const requestMap = new Map(requests.map(r => [r.request_id, r.status]));

            for (const notifData of enrichedList) {
                if (notifData.url) {
                    const match = notifData.url.match(/^\/history\/(\d+)$/);
                    if (match) {
                        const reqId = parseInt(match[1], 10);
                        if (requestMap.has(reqId)) {
                            notifData.request_status = requestMap.get(reqId);
                            notifData.request_id = reqId;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[Notification Service] Error batch fetching request status:', err);
        }
    }

    return enrichedList;
};

/**
 * Đếm số lượng thông báo chưa đọc (Query COUNT(*) siêu nhẹ)
 */
const getUnreadCount = async (personId) => {
    return await notification.count({
        where: {
            notificate_to: personId,
            is_read: false
        }
    });
};

/**
 * Mark a single notification as read if it belongs to the person.
 */
const markAsRead = async (notificationId, personId) => {
    const notif = await notification.findOne({
        where: { notification_id: notificationId, notificate_to: personId }
    });
    if (!notif) return null;
    const updated = await notif.update({ is_read: true });

    // Đồng bộ trạng thái đã đọc tới các tab khác của user
    sseManager.sendToUser(personId, 'notification_read', { notification_id: notificationId });

    return updated;
};

/**
 * Mark all notifications of a person as read.
 */
const markAllAsRead = async (personId) => {
    const result = await notification.update(
        { is_read: true },
        { where: { notificate_to: personId, is_read: false } }
    );

    // Đồng bộ trạng thái đã đọc tất cả tới các tab khác của user
    sseManager.sendToUser(personId, 'all_notifications_read', {});

    return result;
};

module.exports = {
    createNotification,
    getNotificationsByPerson,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
