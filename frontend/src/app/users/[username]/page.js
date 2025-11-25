'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('playing');

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const profileRes = await axios.get(`${API_URL}/users/${username}`, {
        params: { currentUserId: user?.id }
      });

      const data = profileRes.data;
      setProfile(data);

      // Extract library from games array - map to expected format
      const libraryData = data.games?.map(ug => ({
        id: ug.game.id,
        name: ug.game.name,
        imageUrl: ug.favoritedArt?.imageUrl || ug.game.imageUrl,
        giantbombId: ug.game.apiId,
        rating: ug.rating || 0,
        status: ug.status || 'playing'
      })) || [];
      setLibrary(libraryData);

      // Extract followers and following from response
      setFollowers(data.followers || []);
      setFollowing(data.following || []);
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (isFollowing) {
        await axios.post(
          `${API_URL}/users/unfollow`,
          { followingUsername: profile.username },
          { headers: getAuthHeaders() }
        );
        setIsFollowing(false);
        setFollowers(followers.filter((f) => f.follower.id !== user.id));
      } else {
        await axios.post(
          `${API_URL}/users/follow`,
          { followingUsername: profile.username },
          { headers: getAuthHeaders() }
        );
        setIsFollowing(true);
        setFollowers([...followers, { follower: user }]);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleMessage = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    router.push(`/messages?user=${profile.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl neon-text-cyan animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl text-neon-pink">USER NOT FOUND</div>
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="retro-card neon-border-purple p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-retro-darker border-2 border-neon-cyan flex items-center justify-center">
            <span className="font-pixel text-3xl neon-text-cyan">
              {profile.username[0].toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-pixel text-2xl neon-text-pink mb-2">
              {profile.username}
            </h1>
            <div className="flex gap-6 justify-center md:justify-start font-arcade text-sm">
              <span className="text-gray-400">
                <span className="text-neon-cyan">{library.length}</span> GAMES
              </span>
              <span
                onClick={() => setActiveTab('followers')}
                className="text-gray-400 cursor-pointer hover:text-neon-cyan transition-colors"
              >
                <span className="text-neon-cyan">{followers.length}</span> FOLLOWERS
              </span>
              <span
                onClick={() => setActiveTab('following')}
                className="text-gray-400 cursor-pointer hover:text-neon-cyan transition-colors"
              >
                <span className="text-neon-cyan">{following.length}</span> FOLLOWING
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="flex gap-4">
              <button
                onClick={handleFollow}
                className={`retro-btn ${isFollowing ? 'retro-btn-pink' : ''}`}
              >
                {isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
              </button>
              <button onClick={handleMessage} className="retro-btn">
                MESSAGE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => setActiveTab('playing')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-green/30 ${activeTab === 'playing' ? 'neon-border-green' : ''}`}
        >
          <div className="font-pixel text-2xl neon-text-green">
            {library.filter(g => g.status === 'playing').length}
          </div>
          <div className="font-arcade text-xs text-gray-400">PLAYING</div>
        </div>
        <div
          onClick={() => setActiveTab('completed')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-pink/30 ${activeTab === 'completed' ? 'neon-border-pink' : ''}`}
        >
          <div className="font-pixel text-2xl neon-text-pink">
            {library.filter(g => g.status === 'completed').length}
          </div>
          <div className="font-arcade text-xs text-gray-400">REVIEWS</div>
        </div>
        <div
          onClick={() => setActiveTab('backlog')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-purple/30 ${activeTab === 'backlog' ? 'neon-border-purple' : ''}`}
        >
          <div className="font-pixel text-2xl neon-text-purple">
            {library.filter(g => g.status === 'backlog').length}
          </div>
          <div className="font-arcade text-xs text-gray-400">BACKLOGGED</div>
        </div>
        <div
          onClick={() => setActiveTab('dropped')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-500/30 ${activeTab === 'dropped' ? 'border-gray-400' : ''}`}
        >
          <div className="font-pixel text-2xl text-gray-400">
            {library.filter(g => g.status === 'dropped').length}
          </div>
          <div className="font-arcade text-xs text-gray-400">DROPPED</div>
        </div>
      </div>

      {/* Back to games button when viewing followers/following */}
      {(activeTab === 'followers' || activeTab === 'following') && (
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('playing')}
            className="font-arcade text-sm px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-all"
          >
            ← BACK TO GAMES
          </button>
        </div>
      )}

      {/* Tab Content */}
      {['playing', 'completed', 'backlog', 'dropped'].includes(activeTab) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {library.filter(g => g.status === activeTab).length === 0 ? (
            <div className="col-span-full retro-card p-8 text-center">
              <p className="font-arcade text-gray-400">
                NO {activeTab === 'completed' ? 'REVIEWS' : activeTab.toUpperCase()} GAMES
              </p>
            </div>
          ) : (
            library.filter(g => g.status === activeTab).map((game) => (
              <div
                key={game.id}
                onClick={() => router.push(`/game/${game.giantbombId}`)}
                className="retro-card cursor-pointer group"
              >
                <div className="relative aspect-video mb-4 overflow-hidden rounded">
                  {game.imageUrl ? (
                    <Image
                      src={game.imageUrl}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-retro-darker flex items-center justify-center">
                      <span className="font-pixel text-xs text-gray-500">NO IMAGE</span>
                    </div>
                  )}
                </div>
                <h3 className="font-arcade text-sm text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">
                  {game.name}
                </h3>
                {game.rating > 0 && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xs ${
                          star <= game.rating ? 'text-neon-yellow' : 'text-gray-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {followers.length === 0 ? (
            <div className="col-span-full retro-card p-8 text-center">
              <p className="font-arcade text-gray-400">NO FOLLOWERS</p>
            </div>
          ) : (
            followers.map((follow) => (
              <div
                key={follow.follower.id}
                onClick={() => router.push(`/users/${follow.follower.username}`)}
                className="retro-card cursor-pointer hover:neon-border-cyan p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-retro-darker border border-neon-purple flex items-center justify-center">
                  <span className="font-pixel text-lg text-neon-purple">
                    {follow.follower.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="font-arcade text-sm text-white">
                  {follow.follower.username}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {following.length === 0 ? (
            <div className="col-span-full retro-card p-8 text-center">
              <p className="font-arcade text-gray-400">NOT FOLLOWING ANYONE</p>
            </div>
          ) : (
            following.map((follow) => (
              <div
                key={follow.following.id}
                onClick={() => router.push(`/users/${follow.following.username}`)}
                className="retro-card cursor-pointer hover:neon-border-cyan p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-retro-darker border border-neon-purple flex items-center justify-center">
                  <span className="font-pixel text-lg text-neon-purple">
                    {follow.following.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="font-arcade text-sm text-white">
                  {follow.following.username}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
