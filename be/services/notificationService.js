const { notification, person } = require('../models');
const { sendPushNotification } = require('../utils/onesignal');

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

        // Fetch all active subscription IDs for the recipient
        const { push_subscription } = require('../models');
        const subs = await push_subscription.findAll({
            where: { person_id: recipientId }
        });
        
        const subscriptionIds = subs.map(sub => sub.onesignal_id).filter(id => id && id.trim() !== '');

        if (subscriptionIds.length > 0) {
            await sendPushNotification(subscriptionIds, title, content, url);
        }

        return newNotif;
    } catch (error) {
        console.error('[Notification Service] Error creating notification:', error);
    }
};

/**
 * Fetch all notifications for a specific person.
 * @param {number} personId 
 */
const getNotificationsByPerson = async (personId) => {
    return await notification.findAll({
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
