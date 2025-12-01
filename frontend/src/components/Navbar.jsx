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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b-4 border-toy-blue">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 wobble">
            <span className="font-playful text-4xl toy-text-blue">V~</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
            >
              🔍 Search
            </Link>
            <Link
              href="/leaderboards"
              className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
            >
              🏆 Leaders
            </Link>

            {user ? (
              <>
                <Link
                  href="/feed"
                  className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
                >
                  📰 Feed
                </Link>
                <Link
                  href="/profile"
                  className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
                >
                  🎮 Library
                </Link>
                <Link
                  href="/collections"
                  className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
                >
                  📚 Collections
                </Link>
                <Link
                  href="/notifications"
                  className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105"
                >
                  🔔 Alerts
                </Link>
                <Link
                  href="/messages"
                  className="font-fredoka font-semibold text-base px-4 py-2 rounded-full hover:bg-toy-purple/30 transition-all text-toy-blue hover:scale-105 relative"
                >
                  💬 Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-toy-red text-white text-xs font-fredoka font-bold min-w-[24px] h-6 rounded-full flex items-center justify-center animate-bounce px-2">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-fredoka font-bold text-base px-5 py-2 rounded-full bg-toy-red text-white hover:bg-toy-red-dark transition-all hover:scale-105"
                >
                  👋 Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="toy-btn-blue text-sm py-2 px-6"
              >
                🚀 Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
