'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: getAuthHeaders()
      });
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeaders()
      });
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: getAuthHeaders()
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '♥';
      case 'comment': return '💬';
      case 'follow': return '👤';
      default: return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="font-arcade text-gray-500">LOADING...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-pixel text-3xl neon-text-pink">
          NOTIFICATIONS {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="font-arcade text-xs py-2 px-4 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-retro-darker transition-colors"
          >
            MARK ALL AS READ
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="retro-card neon-border-cyan p-12 text-center">
          <p className="font-arcade text-gray-500">NO NOTIFICATIONS YET</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`retro-card p-6 transition-colors ${
                notification.read
                  ? 'neon-border-cyan opacity-60'
                  : 'neon-border-pink'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-arcade text-sm text-white">
                    {notification.content}
                  </p>
                  <p className="font-arcade text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      className="font-arcade text-xs text-neon-cyan hover:text-neon-pink mt-3 inline-block"
                    >
                      VIEW →
                    </Link>
                  )}
                </div>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="font-arcade text-xs text-gray-400 hover:text-neon-cyan flex-shrink-0"
                  >
                    MARK READ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
