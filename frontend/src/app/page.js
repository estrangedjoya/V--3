'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';
import CloudBackground from '@/components/CloudBackground';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function HomePage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [followingDrawings, setFollowingDrawings] = useState([]);
  const [hotDrawings, setHotDrawings] = useState([]);
  const [drawingsLoading, setDrawingsLoading] = useState(true);

  useEffect(() => {
    fetchDrawings();
  }, [user]);

  const fetchDrawings = async () => {
    setDrawingsLoading(true);
    try {
      // Always fetch hot/popular drawings
      const hotResponse = await axios.get(`${API_URL}/drawings/popular`, {
        params: { limit: 12, userId: user?.id }
      });
      setHotDrawings(hotResponse.data);

      // If logged in, also fetch from followed artists
      if (user) {
        const followingResponse = await axios.get(`${API_URL}/drawings/following`, {
          headers: getAuthHeaders(),
          params: { limit: 12 }
        });
        setFollowingDrawings(followingResponse.data);
      }
    } catch (err) {
      console.error('Error fetching drawings:', err);
    } finally {
      setDrawingsLoading(false);
    }
  };

  const handleLikeDrawing = async (drawingId, isLiked, isFollowing) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      if (isLiked) {
        await axios.delete(`${API_URL}/art/${drawingId}/like`, {
          headers: getAuthHeaders()
        });
      } else {
        await axios.post(`${API_URL}/art/${drawingId}/like`, {}, {
          headers: getAuthHeaders()
        });
      }
      // Update local state
      if (isFollowing) {
        setFollowingDrawings(followingDrawings.map(d =>
          d.id === drawingId
            ? { ...d, likes: isLiked ? d.likes - 1 : d.likes + 1, isLiked: !isLiked }
            : d
        ));
      } else {
        setHotDrawings(hotDrawings.map(d =>
          d.id === drawingId
            ? { ...d, likes: isLiked ? d.likes - 1 : d.likes + 1, isLiked: !isLiked }
            : d
        ));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await axios.get(`${API_URL}/games`, {
        params: { search: searchQuery },
      });
      setResults(response.data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <>
      <CloudBackground />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        {/* Hero Section */}
        <div className="text-center py-16 bounce-in">
          <h1 className="font-playful text-7xl mb-6 playful-title float">
            V~
          </h1>
          <p className="font-fredoka text-2xl font-semibold mb-4" style={{ color: '#457B9D' }}>
            Track Your Games • Share Your Art • Connect With Friends
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <span className="badge wobble">🎮 Games</span>
            <span className="badge wobble" style={{ animationDelay: '0.1s' }}>🎨 Art</span>
            <span className="badge wobble" style={{ animationDelay: '0.2s' }}>👥 Friends</span>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for awesome games! 🎮"
              className="toy-input text-lg pr-32"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 toy-btn-yellow py-3 px-6 text-sm"
            >
              {loading ? '...' : 'SEARCH'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center text-toy-red font-fredoka font-bold text-xl mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="sticker-border text-center py-8 max-w-md mx-auto">
            <p className="font-comic text-xl text-gray-600">
              😢 No games found! Try another search
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((game, index) => (
            <div
              key={game.id}
              onClick={() => router.push(`/game/${game.id}`)}
              className="toy-card cursor-pointer wobble"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Game Image */}
              <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-xl">
                {game.image?.medium_url ? (
                  <Image
                    src={game.image.medium_url}
                    alt={game.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-toy-purple to-toy-blue flex items-center justify-center">
                    <span className="font-playful text-2xl">🎮</span>
                  </div>
                )}
              </div>

              {/* Game Info */}
              <h3 className="font-fredoka font-semibold text-base text-toy-blue mb-2 line-clamp-2">
                {game.name}
              </h3>
              {game.original_release_date && (
                <p className="font-fredoka text-sm text-gray-500 font-medium">
                  {new Date(game.original_release_date).getFullYear()}
                </p>
              )}
            </div>
          ))}
        </div>

      {/* Drawings Feed */}
      {!hasSearched && (
        <>
          {/* Artists You Follow Section - Only show when logged in */}
          {user && (
            <div className="mt-20">
              <div className="flex items-center justify-center mb-8">
                <h2 className="font-playful text-4xl toy-text-blue inline-block">
                  🎨 Artists You Follow
                </h2>
              </div>

              {drawingsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-bounce">
                    <span className="font-playful text-4xl">🎨</span>
                  </div>
                  <p className="font-fredoka text-xl text-gray-600 mt-4">Loading artwork...</p>
                </div>
              ) : followingDrawings.length === 0 ? (
                <div className="sticker-border p-12 text-center max-w-2xl mx-auto">
                  <p className="font-fredoka text-xl text-gray-600 mb-4">
                    No drawings from artists you follow yet!
                  </p>
                  <p className="font-fredoka text-lg text-gray-500">
                    Follow some artists to see their awesome work here! 🌟
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {followingDrawings.map((drawing, index) => (
                    <div
                      key={drawing.id}
                      onClick={() => router.push(`/art/${drawing.id}`)}
                      className="drawing-card cursor-pointer bounce-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={drawing.imageUrl}
                          alt="Fan drawing"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="font-fredoka font-semibold text-sm text-toy-blue line-clamp-1">
                          {drawing.game?.name || 'Unknown Game'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-fredoka text-xs text-gray-600">
                            by {drawing.author?.username || 'Unknown'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeDrawing(drawing.id, drawing.isLiked, true);
                            }}
                            className={`font-fredoka text-lg flex items-center gap-1 transition-all ${
                              drawing.isLiked ? 'text-toy-red scale-110' : 'text-gray-400 hover:text-toy-red hover:scale-110'
                            }`}
                          >
                            <span>{drawing.isLiked ? '❤️' : '🤍'}</span>
                            <span className="text-xs">{drawing.likes > 0 && drawing.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Famous Drawings Section - Always show */}
          <div className="mt-20 mb-12">
            <div className="flex items-center justify-center mb-8">
              <h2 className="font-playful text-4xl toy-text-red inline-block">
                ⭐ Famous Drawings
              </h2>
            </div>

            {drawingsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-bounce">
                  <span className="font-playful text-4xl">⭐</span>
                </div>
                <p className="font-fredoka text-xl text-gray-600 mt-4">Loading artwork...</p>
              </div>
            ) : hotDrawings.length === 0 ? (
              <div className="sticker-border p-12 text-center max-w-2xl mx-auto">
                <p className="font-fredoka text-xl text-gray-600 mb-4">
                  No drawings yet - Be the first to post! 🎨
                </p>
                <p className="font-fredoka text-lg text-gray-500">
                  Share your amazing game art with the community!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {hotDrawings.map((drawing, index) => (
                  <div
                    key={drawing.id}
                    onClick={() => router.push(`/art/${drawing.id}`)}
                    className="drawing-card cursor-pointer bounce-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={drawing.imageUrl}
                        alt="Fan drawing"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="font-fredoka font-semibold text-sm text-toy-blue line-clamp-1">
                        {drawing.game?.name || 'Unknown Game'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-fredoka text-xs text-gray-600">
                          by {drawing.author?.username || 'Unknown'}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeDrawing(drawing.id, drawing.isLiked, false);
                          }}
                          className={`font-fredoka text-lg flex items-center gap-1 transition-all ${
                            drawing.isLiked ? 'text-toy-red scale-110' : 'text-gray-400 hover:text-toy-red hover:scale-110'
                          }`}
                        >
                          <span>{drawing.isLiked ? '❤️' : '🤍'}</span>
                          <span className="text-xs">{drawing.likes > 0 && drawing.likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </>
  );
}
