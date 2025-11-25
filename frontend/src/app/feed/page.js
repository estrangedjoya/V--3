'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function FeedPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchActivities();

    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/activities`, {
        headers: getAuthHeaders()
      });
      setActivities(response.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'comment': return '💬';
      case 'post': return '🎨';
      case 'review': return '⭐';
      case 'collection': return '📁';
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-pixel text-3xl neon-text-pink mb-8">ACTIVITY FEED</h1>

      {activities.length === 0 ? (
        <div className="retro-card neon-border-cyan p-12 text-center">
          <p className="font-arcade text-gray-500 mb-4">NO ACTIVITY YET</p>
          <p className="font-arcade text-xs text-gray-600 mb-6">
            Follow users to see their activity here!
          </p>
          <Link href="/search" className="retro-btn text-xs py-2 px-6">
            FIND USERS
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="retro-card neon-border-purple p-6"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-arcade text-sm text-white">
                    <Link
                      href={`/users/${activity.user.username}`}
                      className="text-neon-cyan hover:text-neon-pink"
                    >
                      @{activity.user.username}
                    </Link>
                    {' '}
                    {activity.content}
                  </p>
                  <p className="font-arcade text-xs text-gray-500 mt-2">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                  {activity.link && (
                    <Link
                      href={activity.link}
                      className="font-arcade text-xs text-neon-cyan hover:text-neon-pink mt-3 inline-block"
                    >
                      VIEW →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
