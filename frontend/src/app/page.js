'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';

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
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="font-pixel text-5xl mb-4 glitch" data-text="V~">
          <span className="neon-text-blue">V~</span>
        </h1>
        <p className="font-arcade text-lg neon-text-sky mb-8">
          TRACK YOUR GAMES • SHARE THE ART • CONNECT WITH PEOPLE
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for games..."
            className="retro-input text-lg pr-24"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 retro-btn-blue py-2 px-4 text-xs"
          >
            {loading ? '...' : 'SEARCH'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center text-neon-pink font-arcade mb-8">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="text-center text-gray-400 font-arcade">
          NO GAMES FOUND
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((game) => (
          <div
            key={game.id}
            onClick={() => router.push(`/game/${game.id}`)}
            className="retro-card cursor-pointer group"
          >
            {/* Game Image */}
            <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded">
              {game.image?.medium_url ? (
                <Image
                  src={game.image.medium_url}
                  alt={game.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-retro-darker flex items-center justify-center">
                  <span className="font-pixel text-xs text-gray-500">NO IMAGE</span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-retro-dark/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Game Info */}
            <h3 className="font-arcade text-sm text-white mb-2 line-clamp-2 group-hover:text-sky-medium transition-colors">
              {game.name}
            </h3>
            {game.original_release_date && (
              <p className="font-arcade text-xs text-gray-500">
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
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-pixel text-2xl neon-text-sky">
                  ARTISTS YOU FOLLOW
                </h2>
              </div>

              {drawingsLoading ? (
                <div className="text-center py-8">
                  <span className="font-arcade text-gray-400 animate-pulse">LOADING...</span>
                </div>
              ) : followingDrawings.length === 0 ? (
                <div className="retro-card neon-border-blue p-8 text-center">
                  <p className="font-arcade text-gray-400">
                    NO DRAWINGS FROM ARTISTS YOU FOLLOW YET
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {followingDrawings.map((drawing) => (
                    <div
                      key={drawing.id}
                      onClick={() => router.push(`/art/${drawing.id}`)}
                      className="retro-card p-2 cursor-pointer group"
                    >
                      <div className="relative aspect-square rounded overflow-hidden mb-2">
                        <Image
                          src={drawing.imageUrl}
                          alt="Fan drawing"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="font-arcade text-xs text-white line-clamp-1 group-hover:text-sky-medium transition-colors">
                          {drawing.game?.name || 'Unknown Game'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-arcade text-xs text-gray-500">
                            by {drawing.author?.username || 'Unknown'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeDrawing(drawing.id, drawing.isLiked, true);
                            }}
                            className={`font-arcade text-xs flex items-center gap-1 transition-colors ${
                              drawing.isLiked ? 'text-sky-medium' : 'text-gray-500 hover:text-sky-medium'
                            }`}
                          >
                            <span className="text-sm">{drawing.isLiked ? '♥' : '♡'}</span>
                            {drawing.likes > 0 && drawing.likes}
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
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-pixel text-2xl neon-text-blue">
                FAMOUS DRAWINGS
              </h2>
            </div>

            {drawingsLoading ? (
              <div className="text-center py-8">
                <span className="font-arcade text-gray-400 animate-pulse">LOADING...</span>
              </div>
            ) : hotDrawings.length === 0 ? (
              <div className="retro-card neon-border-blue p-8 text-center">
                <p className="font-arcade text-gray-400">
                  NO DRAWINGS YET - BE THE FIRST TO POST!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {hotDrawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    onClick={() => router.push(`/art/${drawing.id}`)}
                    className="retro-card p-2 cursor-pointer group"
                  >
                    <div className="relative aspect-square rounded overflow-hidden mb-2">
                      <Image
                        src={drawing.imageUrl}
                        alt="Fan drawing"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-arcade text-xs text-white line-clamp-1 group-hover:text-sky-medium transition-colors">
                        {drawing.game?.name || 'Unknown Game'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-arcade text-xs text-gray-500">
                          by {drawing.author?.username || 'Unknown'}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeDrawing(drawing.id, drawing.isLiked, false);
                          }}
                          className={`font-arcade text-xs flex items-center gap-1 transition-colors ${
                            drawing.isLiked ? 'text-sky-medium' : 'text-gray-500 hover:text-sky-medium'
                          }`}
                        >
                          <span className="text-sm">{drawing.isLiked ? '♥' : '♡'}</span>
                          {drawing.likes > 0 && drawing.likes}
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
  );
}
