'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';

const API_URL = 'http://localhost:3001/api';

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inLibrary, setInLibrary] = useState(false);
  const [status, setStatus] = useState('playing');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [internalGameId, setInternalGameId] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [drawingSort, setDrawingSort] = useState('recent');
  const [reviews, setReviews] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [artFile, setArtFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [allowCropping, setAllowCropping] = useState(true);

  useEffect(() => {
    fetchGameDetails();
    fetchDrawings();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/${id}/reviews`);
      setReviews(response.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const fetchDrawings = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/${id}/art`, {
        params: { userId: user?.id }
      });
      setDrawings(response.data);
    } catch (err) {
      console.error('Error fetching drawings:', err);
    }
  };

  const handleLikeDrawing = async (drawingId, isLiked) => {
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
      setDrawings(drawings.map(d =>
        d.id === drawingId
          ? { ...d, likes: isLiked ? d.likes - 1 : d.likes + 1, isLiked: !isLiked }
          : d
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getSortedDrawings = () => {
    const sorted = [...drawings];
    switch (drawingSort) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'top':
        return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'hot':
        // Hot = recent + popular (weighted score)
        const now = new Date();
        return sorted.sort((a, b) => {
          const ageA = (now - new Date(a.createdAt)) / (1000 * 60 * 60); // hours
          const ageB = (now - new Date(b.createdAt)) / (1000 * 60 * 60);
          const scoreA = (a.likes || 0) / Math.pow(ageA + 2, 1.5);
          const scoreB = (b.likes || 0) / Math.pow(ageB + 2, 1.5);
          return scoreB - scoreA;
        });
      default:
        return sorted;
    }
  };

  const fetchGameDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/${id}`);
      setGame(response.data.results);

      // Check if game is in user's library
      if (user) {
        try {
          const libraryResponse = await axios.get(`${API_URL}/user/${user.id}/games`, {
            headers: getAuthHeaders(),
          });
          const games = libraryResponse.data.games || [];
          const inLib = games.some(
            (g) => g.game.apiId === String(id)
          );
          setInLibrary(inLib);
          if (inLib) {
            const userGame = games.find(
              (g) => g.game.apiId === String(id)
            );
            if (userGame) {
              setStatus(userGame.status || 'playing');
              setRating(userGame.rating || 0);
              setReview(userGame.reviewText || '');
              setInternalGameId(userGame.gameId);
            }
          }
        } catch (err) {
          console.error('Error checking library:', err);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/user/games`,
        {
          gameApiId: id,
          gameName: game.name,
          gameImageUrl: game.image?.medium_url || '',
          status,
        },
        { headers: getAuthHeaders() }
      );
      setInLibrary(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to library');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGame = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/user/games`,
        { gameId: internalGameId, status, rating, reviewText: review },
        { headers: getAuthHeaders() }
      );
      // Refresh reviews after update
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    setSaving(true);
    try {
      await axios.delete(`${API_URL}/user/games/${internalGameId}`, {
        headers: getAuthHeaders(),
      });
      setInLibrary(false);
      setRating(0);
      setReview('');
      setStatus('playing');
      setInternalGameId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadArt = async (e) => {
    e.preventDefault();
    if (!artFile || !internalGameId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('artFile', artFile);
    formData.append('gameId', internalGameId);
    formData.append('allowCropping', allowCropping);

    try {
      await axios.post(`${API_URL}/user/games/upload-art`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      setArtFile(null);
      setShowUploadModal(false);
      setAllowCropping(true);
      fetchDrawings();
    } catch (err) {
      console.error('Error uploading art:', err);
    } finally {
      setUploading(false);
    }
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

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl text-neon-pink">
          {error || 'GAME NOT FOUND'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Image */}
        <div className="md:col-span-1">
          <div className="retro-card neon-border-cyan p-4">
            <div className="relative aspect-[3/4] rounded overflow-hidden">
              {game.image?.medium_url ? (
                <Image
                  src={game.image.medium_url}
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-retro-darker flex items-center justify-center">
                  <span className="font-pixel text-sm text-gray-500">NO IMAGE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Title */}
          <h1 className="font-pixel text-3xl neon-text-pink">{game.name}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 font-arcade text-sm">
            {game.original_release_date && (
              <span className="text-neon-cyan">
                {new Date(game.original_release_date).getFullYear()}
              </span>
            )}
            {game.platforms && (
              <span className="text-gray-400">
                {game.platforms.map((p) => p.name).join(', ')}
              </span>
            )}
          </div>

          {/* Description */}
          {game.deck && (
            <p className="text-gray-300 font-arcade text-sm leading-relaxed">
              {game.deck}
            </p>
          )}

          {/* User Actions */}
          {user && (
            <div className="retro-card neon-border-purple p-6 space-y-4">
              <h3 className="font-pixel text-lg neon-text-cyan mb-4">
                {inLibrary ? 'UPDATE YOUR STATUS' : 'ADD TO LIBRARY'}
              </h3>

              {/* Status */}
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="retro-input"
                >
                  <option value="playing">Playing</option>
                  <option value="completed">Completed</option>
                  <option value="backlog">Backlog</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block font-arcade text-xs text-neon-cyan mb-2">
                  RATING
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-colors ${
                        star <= rating ? 'text-neon-yellow' : 'text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Review */}
              <div>
                <label className="block font-arcade text-xs text-neon-cyan mb-2">
                  REVIEW
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="retro-input resize-none"
                  placeholder="Write your thoughts..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                {inLibrary ? (
                  <>
                    <button
                      onClick={handleUpdateGame}
                      disabled={saving}
                      className="retro-btn flex-1"
                    >
                      {saving ? 'SENDING...' : 'SEND'}
                    </button>
                    <button
                      onClick={handleRemoveFromLibrary}
                      disabled={saving}
                      className="retro-btn retro-btn-pink"
                    >
                      REMOVE
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddToLibrary}
                    disabled={saving}
                    className="retro-btn w-full"
                  >
                    {saving ? 'ADDING...' : 'ADD TO LIBRARY'}
                  </button>
                )}
              </div>

              {/* Post Drawing Button - only show if game is in library */}
              {inLibrary && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full mt-4 font-arcade text-xs py-3 border-2 border-neon-purple text-neon-purple hover:bg-neon-purple/10 transition-colors"
                >
                  POST A DRAWING
                </button>
              )}
            </div>
          )}

          {!user && (
            <div className="retro-card neon-border-purple p-6 text-center">
              <p className="font-arcade text-sm text-gray-400 mb-4">
                LOGIN TO ADD THIS GAME TO YOUR LIBRARY
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="retro-btn"
              >
                LOGIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current Thoughts - from users currently playing */}
      {reviews.filter(r => r.status === 'playing' && r.reviewText).length > 0 && (
        <div className="mt-12">
          <h2 className="font-pixel text-2xl neon-text-cyan mb-6">CURRENT THOUGHTS</h2>
          <div className="space-y-4">
            {reviews
              .filter(r => r.status === 'playing' && r.reviewText)
              .map((r) => (
                <div key={r.userId} className="retro-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      onClick={() => router.push(`/users/${r.user.username}`)}
                      className="font-arcade text-sm text-neon-cyan cursor-pointer hover:text-neon-pink"
                    >
                      {r.user.username}
                    </span>
                    <span className="font-arcade text-xs text-neon-green">PLAYING</span>
                  </div>
                  <p className="font-arcade text-sm text-gray-300 leading-relaxed">
                    {r.reviewText}
                  </p>
                  {r.rating > 0 && (
                    <div className="flex gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= r.rating ? 'text-neon-yellow' : 'text-gray-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reviews - from users who completed the game */}
      {reviews.filter(r => r.status === 'completed' && r.reviewText).length > 0 && (
        <div className="mt-12">
          <h2 className="font-pixel text-2xl neon-text-pink mb-6">REVIEWS</h2>
          <div className="space-y-4">
            {reviews
              .filter(r => r.status === 'completed' && r.reviewText)
              .map((r) => (
                <div key={r.userId} className="retro-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      onClick={() => router.push(`/users/${r.user.username}`)}
                      className="font-arcade text-sm text-neon-cyan cursor-pointer hover:text-neon-pink"
                    >
                      {r.user.username}
                    </span>
                    <span className="font-arcade text-xs text-neon-pink">COMPLETED</span>
                  </div>
                  <p className="font-arcade text-sm text-gray-300 leading-relaxed">
                    {r.reviewText}
                  </p>
                  {r.rating > 0 && (
                    <div className="flex gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= r.rating ? 'text-neon-yellow' : 'text-gray-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Drawings Gallery */}
      {drawings.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-pixel text-2xl neon-text-purple">DRAWINGS</h2>
            <div className="flex gap-2">
              {['hot', 'recent', 'top'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setDrawingSort(sort)}
                  className={`font-arcade text-xs px-3 py-1 border transition-all ${
                    drawingSort === sort
                      ? 'border-neon-pink text-neon-pink'
                      : 'border-retro-border text-gray-400 hover:border-neon-cyan'
                  }`}
                >
                  {sort.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {getSortedDrawings().map((drawing) => (
              <div
                key={drawing.id}
                onClick={() => router.push(`/drawing/${drawing.id}`)}
                className="retro-card p-2 group cursor-pointer"
              >
                <div className="relative aspect-square rounded overflow-hidden mb-2">
                  <Image
                    src={drawing.imageUrl}
                    alt="Fan drawing"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-arcade text-xs text-gray-400">
                    by {drawing.author?.username || 'Unknown'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikeDrawing(drawing.id, drawing.isLiked);
                    }}
                    className={`font-arcade text-xs flex items-center gap-1 transition-colors ${
                      drawing.isLiked ? 'text-neon-pink' : 'text-gray-500 hover:text-neon-pink'
                    }`}
                  >
                    <span className="text-sm">{drawing.isLiked ? '♥' : '♡'}</span>
                    {drawing.likes > 0 && drawing.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Art Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="retro-card neon-border-pink p-6 max-w-md w-full">
            <h3 className="font-pixel text-lg neon-text-pink mb-4">
              POST A DRAWING
            </h3>
            <p className="font-arcade text-sm text-gray-400 mb-4">
              {game?.name}
            </p>
            <form onSubmit={handleUploadArt} className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArtFile(e.target.files[0])}
                className="w-full font-arcade text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-neon-cyan file:bg-transparent file:text-neon-cyan file:font-arcade file:text-xs"
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCropping}
                  onChange={(e) => setAllowCropping(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-neon-cyan"
                />
                <span className="font-arcade text-xs text-gray-400 leading-relaxed">
                  Allow users to download cropped versions of this drawing for different device sizes (not scaled)
                </span>
              </label>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!artFile || uploading}
                  className="retro-btn flex-1"
                >
                  {uploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setArtFile(null);
                  }}
                  className="retro-btn retro-btn-pink"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
