'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, getAuthHeaders } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const hasUnreadMessages = (conversation) => {
      if (!conversation.messages || conversation.messages.length === 0) return false;
      const lastMessage = conversation.messages[conversation.messages.length - 1];

      // Not unread if you sent the last message
      if (lastMessage.senderId === user.id) return false;

      // Check localStorage for last read time
      const lastReadKey = `lastRead_${user.id}_${conversation.id}`;
      const lastReadTime = localStorage.getItem(lastReadKey);

      if (!lastReadTime) return true; // Never read

      // Check if last message is newer than last read time
      return new Date(lastMessage.createdAt) > new Date(lastReadTime);
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/conversations`, {
          headers: getAuthHeaders(),
        });

        // Count conversations with unread messages
        const unread = response.data.filter(hasUnreadMessages).length;

        setUnreadCount(unread);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-darker/95 backdrop-blur-sm border-b-2 border-neon-purple">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-pixel text-2xl neon-text-pink">V~</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
            >
              Search
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
                >
                  Library
                </Link>
                <Link
                  href={`/users/${user.username}`}
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/messages"
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors relative"
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-neon-pink text-white text-xs font-pixel w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-arcade text-sm text-neon-pink hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="retro-btn text-xs py-2 px-4"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
