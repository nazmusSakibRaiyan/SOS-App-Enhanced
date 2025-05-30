import Notification from '../models/Notification.js';
import User from '../models/user.js';
import SOS from '../models/SOS.js';
import { io } from '../server.js';
import { sendEmail } from '../utils/sendEmail.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

export const createSOSNotification = async (sosId, userId, volunteers = []) => {
  try {
    const sos = await SOS.findById(sosId).populate('user', 'name email phone');
    const user = await User.findById(userId);
    
    if (!sos || !user) {
      console.error('SOS or user not found');
      return;
    }

    for (const volunteerId of volunteers) {
      const volunteer = await User.findById(volunteerId);
      
      if (volunteer) {
        const notification = new Notification({
          recipient: volunteerId,
          type: 'SOS',
          title: 'Emergency SOS Alert',
          message: `${user.name} has triggered an SOS alert and needs help!`,
          relatedId: sosId,
          onModel: 'SOS',
          metadata: {
            latitude: sos.coordinates.latitude,
            longitude: sos.coordinates.longitude,
            message: sos.message
          }
        });
        
        await notification.save();
        
        if (volunteer.socketId) {
          io.to(volunteer.socketId).emit('sosAlert', {
            notification,
            sos
          });
        }
        
        sendEmail(
          volunteer.email,
          'URGENT: SOS Emergency Alert',
          `${user.name} has triggered an emergency SOS alert and needs help. Please check the app immediately.`
        );
      }
    }
    
    
  } catch (error) {
    console.error('Error in createSOSNotification:', error);
  }
};

export const createReminderNotification = async (userId, relatedId, message, onModel = 'SOS') => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }
    
    const notification = new Notification({
      recipient: userId,
      type: 'REMINDER',
      title: 'Action Required',
      message,
      relatedId,
      onModel,
      isRead: false
    });
    
    await notification.save();
    
    if (user.socketId) {
      io.to(user.socketId).emit('reminder', notification);
    }
    

    sendEmail(
      user.email,
      'Reminder: Action Required',
      message
    );
    
  } catch (error) {
    console.error('Error in createReminderNotification:', error);
  }
};

export const updateSOSReadStatus = async (req, res) => {
  try {
    const { sosId } = req.params;
    const volunteerId = req.user.id;
    
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can mark SOS alerts as read' });
    }
    
    await Notification.findOneAndUpdate(
      {
        recipient: volunteerId,
        relatedId: sosId,
        type: 'SOS',
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );


    const sos = await SOS.findById(sosId);
    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }
    
    const volunteer = await User.findById(volunteerId, 'name email');
    const sosCreator = await User.findById(sos.user);
    
    if (sosCreator && sosCreator.socketId) {
      io.to(sosCreator.socketId).emit('sosReadReceipt', {
        sosId,
        volunteer: {
          id: volunteerId,
          name: volunteer.name
        },
        readAt: new Date()
      });
    }
    
    res.status(200).json({ success: true, message: 'SOS marked as read' });
  } catch (error) {
    console.error('Error in updateSOSReadStatus:', error);
    res.status(500).json({ message: 'Failed to update SOS read status' });
  }
};

export const sendPendingResponseReminders = async () => {
  try {

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const pendingSOS = await SOS.find({
      isResolved: false,
      createdAt: { $lt: fiveMinutesAgo }
    });
    
    for (const sos of pendingSOS) {

      const notifiedVolunteers = await Notification.find({
        relatedId: sos._id,
        type: 'SOS',
        isRead: false
      });
      
      for (const notification of notifiedVolunteers) {

        createReminderNotification(
          notification.recipient,
          sos._id,
          'Reminder: Someone needs your help! Please respond to the pending SOS alert.',
          'SOS'
        );
      }
    }
  } catch (error) {
    console.error('Error in sendPendingResponseReminders:', error);
  }
};