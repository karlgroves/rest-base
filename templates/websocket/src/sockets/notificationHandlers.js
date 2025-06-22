/**
 * Notification Event Handlers
 *
 * Handles notification-related WebSocket events
 * @author {{author}}
 */

const logger = require('../utils/logger');

// In-memory notification storage (replace with database in production)
const userSubscriptions = new Map(); // userId -> Set of subscription topics
const userNotifications = new Map(); // userId -> Array of notifications
const topicSubscribers = new Map(); // topic -> Set of userIds

/**
 * Subscribe to notification topics
 */
const subscribe = async (socket, data, callback) => {
  const { topics } = data || {};
  
  if (!Array.isArray(topics) || topics.length === 0) {
    if (callback) callback({ error: 'Topics array is required' });
    return;
  }

  // Validate topics
  const validTopics = topics.filter(topic => 
    typeof topic === 'string' && 
    topic.length > 0 && 
    topic.length <= 100 &&
    /^[a-zA-Z0-9._-]+$/.test(topic)
  );

  if (validTopics.length === 0) {
    if (callback) callback({ error: 'No valid topics provided' });
    return;
  }

  // Initialize user subscriptions if needed
  if (!userSubscriptions.has(socket.userId)) {
    userSubscriptions.set(socket.userId, new Set());
  }

  const userSubs = userSubscriptions.get(socket.userId);
  const newSubscriptions = [];

  // Add subscriptions
  for (const topic of validTopics) {
    if (!userSubs.has(topic)) {
      userSubs.add(topic);
      newSubscriptions.push(topic);

      // Add to topic subscribers
      if (!topicSubscribers.has(topic)) {
        topicSubscribers.set(topic, new Set());
      }
      topicSubscribers.get(topic).add(socket.userId);

      // Join socket room for this topic
      socket.join(`notification:${topic}`);
    }
  }

  logger.info({
    component: 'notification',
    event: 'subscribe',
    socketId: socket.id,
    userId: socket.userId,
    topics: newSubscriptions,
    totalSubscriptions: userSubs.size
  }, 'User subscribed to notification topics');

  if (callback) {
    callback({
      success: true,
      subscribedTopics: newSubscriptions,
      totalSubscriptions: userSubs.size,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Unsubscribe from notification topics
 */
const unsubscribe = async (socket, data, callback) => {
  const { topics } = data || {};
  
  if (!Array.isArray(topics) || topics.length === 0) {
    if (callback) callback({ error: 'Topics array is required' });
    return;
  }

  if (!userSubscriptions.has(socket.userId)) {
    if (callback) callback({ error: 'No subscriptions found' });
    return;
  }

  const userSubs = userSubscriptions.get(socket.userId);
  const removedSubscriptions = [];

  // Remove subscriptions
  for (const topic of topics) {
    if (userSubs.has(topic)) {
      userSubs.delete(topic);
      removedSubscriptions.push(topic);

      // Remove from topic subscribers
      if (topicSubscribers.has(topic)) {
        topicSubscribers.get(topic).delete(socket.userId);
        
        // Clean up empty topic
        if (topicSubscribers.get(topic).size === 0) {
          topicSubscribers.delete(topic);
        }
      }

      // Leave socket room for this topic
      socket.leave(`notification:${topic}`);
    }
  }

  // Clean up empty user subscriptions
  if (userSubs.size === 0) {
    userSubscriptions.delete(socket.userId);
  }

  logger.info({
    component: 'notification',
    event: 'unsubscribe',
    socketId: socket.id,
    userId: socket.userId,
    topics: removedSubscriptions,
    remainingSubscriptions: userSubs.size
  }, 'User unsubscribed from notification topics');

  if (callback) {
    callback({
      success: true,
      unsubscribedTopics: removedSubscriptions,
      remainingSubscriptions: userSubs.size,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark notifications as read
 */
const markAsRead = async (socket, data, callback) => {
  const { notificationIds } = data || {};
  
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    if (callback) callback({ error: 'Notification IDs array is required' });
    return;
  }

  if (!userNotifications.has(socket.userId)) {
    if (callback) callback({ error: 'No notifications found' });
    return;
  }

  const notifications = userNotifications.get(socket.userId);
  let markedCount = 0;

  // Mark notifications as read
  for (const notification of notifications) {
    if (notificationIds.includes(notification.id) && !notification.read) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      markedCount++;
    }
  }

  logger.info({
    component: 'notification',
    event: 'mark_read',
    socketId: socket.id,
    userId: socket.userId,
    markedCount,
    requestedIds: notificationIds.length
  }, 'Notifications marked as read');

  if (callback) {
    callback({
      success: true,
      markedCount,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send notification to topic subscribers
 */
const sendNotificationToTopic = (topic, notification) => {
  if (!topicSubscribers.has(topic)) {
    return 0; // No subscribers
  }

  const subscribers = topicSubscribers.get(topic);
  let sentCount = 0;

  for (const userId of subscribers) {
    // Store notification for user
    if (!userNotifications.has(userId)) {
      userNotifications.set(userId, []);
    }

    const userNotifs = userNotifications.get(userId);
    const userNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      priority: notification.priority || 'normal',
      read: false,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    userNotifs.push(userNotification);
    
    // Keep only last 100 notifications per user
    if (userNotifs.length > 100) {
      userNotifs.splice(0, userNotifs.length - 100);
    }

    sentCount++;
  }

  return sentCount;
};

/**
 * Send notification to specific user
 */
const sendNotificationToUser = (userId, notification) => {
  // Store notification for user
  if (!userNotifications.has(userId)) {
    userNotifications.set(userId, []);
  }

  const userNotifs = userNotifications.get(userId);
  const userNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    topic: notification.topic || 'direct',
    title: notification.title,
    message: notification.message,
    data: notification.data || {},
    priority: notification.priority || 'normal',
    read: false,
    createdAt: new Date().toISOString(),
    readAt: null
  };

  userNotifs.push(userNotification);
  
  // Keep only last 100 notifications per user
  if (userNotifs.length > 100) {
    userNotifs.splice(0, userNotifs.length - 100);
  }

  return 1;
};

/**
 * Get user's notifications
 */
const getUserNotifications = (userId, options = {}) => {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  
  if (!userNotifications.has(userId)) {
    return [];
  }

  const notifications = userNotifications.get(userId);
  let filtered = notifications;

  if (unreadOnly) {
    filtered = notifications.filter(notif => !notif.read);
  }

  return filtered
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(offset, offset + limit);
};

/**
 * Get user's subscription topics
 */
const getUserSubscriptions = (userId) => {
  const subs = userSubscriptions.get(userId);
  return subs ? Array.from(subs) : [];
};

/**
 * Clean up user's subscriptions on disconnect
 */
const cleanupUserSubscriptions = (userId) => {
  if (userSubscriptions.has(userId)) {
    const userSubs = userSubscriptions.get(userId);
    
    // Remove from topic subscribers
    for (const topic of userSubs) {
      if (topicSubscribers.has(topic)) {
        topicSubscribers.get(topic).delete(userId);
        
        // Clean up empty topic
        if (topicSubscribers.get(topic).size === 0) {
          topicSubscribers.delete(topic);
        }
      }
    }
    
    userSubscriptions.delete(userId);
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  markAsRead,
  sendNotificationToTopic,
  sendNotificationToUser,
  getUserNotifications,
  getUserSubscriptions,
  cleanupUserSubscriptions
};