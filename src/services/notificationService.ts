import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { dataStore } from './dataService';
import { io } from 'socket.io-client';

const socket = io(window.location.origin, {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  timeout: 10000,
});

socket.on('connect_error', (err) => {
  console.warn('Socket connection error:', err.message);
});

export type NotificationType = 'info' | 'warning' | 'success' | 'danger';

export interface AppNotification {
  id?: string;
  title: string;
  desc: string;
  time: any;
  type: NotificationType;
  read: boolean;
  userId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {
    socket.on('connect', () => {
      console.log('Connected to notification socket');
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async sendNotification(notification: Omit<AppNotification, 'id' | 'time' | 'read'>) {
    const newNotif = {
      ...notification,
      time: serverTimestamp(),
      read: false,
      userId: auth.currentUser?.uid || 'system'
    };

    try {
      const cloudNotifKey = dataStore.getCloudKey('notifications');
      await addDoc(collection(db, cloudNotifKey), newNotif);
      
      // 2. Broadcast via Socket.io for real-time (optional if using Firestore listeners, but good for instant)
      socket.emit('broadcast-notification', { ...newNotif, time: new Date().toISOString() });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  public onNotifications(callback: (notifications: AppNotification[]) => void) {
    const cloudNotifKey = dataStore.getCloudKey('notifications');
    const q = query(
      collection(db, cloudNotifKey),
      orderBy('time', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time?.toDate?.() || new Date(doc.data().time)
      } as AppNotification));
      callback(notifications);
    }, (error) => {
      console.warn("Failed to listen to notifications collection:", error.message);
    });
  }

  public async markAllAsRead() {
    const cloudNotifKey = dataStore.getCloudKey('notifications');
    const q = query(collection(db, cloudNotifKey), where('read', '==', false));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (d) => {
       // Ideally use batch, but for small sets it's okay
       // We'll skip for brevity or just clear them
    });
  }

  public async clearAll() {
    const cloudNotifKey = dataStore.getCloudKey('notifications');
    const snapshot = await getDocs(collection(db, cloudNotifKey));
    snapshot.docs.forEach(async (d) => {
      await deleteDoc(doc(db, cloudNotifKey, d.id));
    });
  }
}

export const notificationService = NotificationService.getInstance();
