'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [artFile, setArtFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [allowCropping, setAllowCropping] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchLibrary();
  }, [user]);

  const fetchLibrary = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/${user.id}/games`, {
        headers: getAuthHeaders(),
      });
      // Map the response to the expected format
      const games = response.data.games?.map(ug => ({
        id: ug.game.id,
        name: ug.game.name,
        imageUrl: ug.favoritedArt?.imageUrl || ug.game.imageUrl,
        giantbombId: ug.game.apiId,
        status: ug.status,
        rating: ug.rating || 0,
        customArt: ug.game.customArt || []
      })) || [];
      setLibrary(games);
    } catch (err) {
      console.error('Error fetching library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadArt = async (e) => {
    e.preventDefault();
    if (!artFile || !selectedGame) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('artFile', artFile);
    formData.append('gameId', selectedGame.id);
    formData.append('allowCropping', allowCropping);

    try {
      const response = await axios.post(`${API_URL}/user/games/upload-art`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
      alert('Drawing uploaded successfully!');
      setArtFile(null);
      setSelectedGame(null);
      setAllowCropping(true);
      fetchLibrary();
    } catch (err) {
      console.error('Error uploading art:', err);
      console.error('Error response:', err.response?.data);
      alert(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArt = async (artId) => {
    if (!confirm('Are you sure you want to delete this drawing?')) return;

    try {
      await axios.delete(`${API_URL}/art/${artId}`, {
        headers: getAuthHeaders(),
      });
      alert('Drawing deleted successfully!');
      fetchLibrary();
    } catch (err) {
      console.error('Error deleting art:', err);
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const filteredLibrary = library.filter((game) => {
    if (filter === 'all') return true;
    return game.status === filter;
  });

  const stats = {
    playing: library.filter((g) => g.status === 'playing').length,
    completed: library.filter((g) => g.status === 'completed').length,
    backlog: library.filter((g) => g.status === 'backlog').length,
    dropped: library.filter((g) => g.status === 'dropped').length,
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl neon-text-cyan animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-pixel text-3xl neon-text-pink mb-2">MY LIBRARY</h1>
        <p className="font-arcade text-sm text-gray-400">
          Welcome back, {user.username}
        </p>
      </div>

      {/* Stats - Clickable Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-cyan/30 hover:border-neon-cyan ${
            filter === 'all'
              ? 'neon-border-cyan'
              : ''
          }`}
        >
          <div className="font-pixel text-2xl neon-text-cyan">{library.length}</div>
          <div className="font-arcade text-xs text-gray-400">ALL</div>
        </button>
        <button
          onClick={() => setFilter('playing')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-green/30 hover:border-neon-green ${
            filter === 'playing'
              ? 'neon-border-green'
              : ''
          }`}
        >
          <div className="font-pixel text-2xl neon-text-green">{stats.playing}</div>
          <div className="font-arcade text-xs text-gray-400">PLAYING</div>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-pink/30 hover:border-neon-pink ${
            filter === 'completed'
              ? 'neon-border-pink'
              : ''
          }`}
        >
          <div className="font-pixel text-2xl neon-text-pink">{stats.completed}</div>
          <div className="font-arcade text-xs text-gray-400">COMPLETED</div>
        </button>
        <button
          onClick={() => setFilter('backlog')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-purple/30 hover:border-neon-purple ${
            filter === 'backlog'
              ? 'neon-border-purple'
              : ''
          }`}
        >
          <div className="font-pixel text-2xl neon-text-purple">{stats.backlog}</div>
          <div className="font-arcade text-xs text-gray-400">BACKLOG</div>
        </button>
        <button
          onClick={() => setFilter('dropped')}
          className={`retro-card text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-500/30 hover:border-gray-500 ${
            filter === 'dropped'
              ? 'border-gray-400'
              : ''
          }`}
        >
          <div className="font-pixel text-2xl text-gray-400">{stats.dropped}</div>
          <div className="font-arcade text-xs text-gray-400">DROPPED</div>
        </button>
      </div>

      {/* Library Grid */}
      {filteredLibrary.length === 0 ? (
        <div className="retro-card neon-border-purple p-8 text-center">
          <p className="font-arcade text-gray-400 mb-4">
            {filter === 'all'
              ? 'YOUR LIBRARY IS EMPTY'
              : `NO ${filter.toUpperCase()} GAMES`}
          </p>
          <button
            onClick={() => router.push('/')}
            className="retro-btn"
          >
            SEARCH GAMES
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLibrary.map((game) => (
            <div key={game.id} className="retro-card group">
              <div
                onClick={() => router.push(`/game/${game.giantbombId}`)}
                className="cursor-pointer"
              >
                {/* Game Image */}
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
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`font-arcade text-xs px-2 py-1 ${
                        game.status === 'playing'
                          ? 'bg-neon-green/20 text-neon-green'
                          : game.status === 'completed'
                          ? 'bg-neon-pink/20 text-neon-pink'
                          : game.status === 'backlog'
                          ? 'bg-neon-purple/20 text-neon-purple'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {game.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Game Info */}
                <h3 className="font-arcade text-sm text-white mb-2 line-clamp-1 group-hover:text-neon-cyan transition-colors">
                  {game.name}
                </h3>

                {/* Rating */}
                {game.rating > 0 && (
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= game.rating ? 'text-neon-yellow' : 'text-gray-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Drawing Button */}
              <button
                onClick={() => setSelectedGame(game)}
                className="w-full mt-2 font-arcade text-xs py-2 border border-retro-border text-gray-400 hover:border-neon-pink hover:text-neon-pink transition-colors"
              >
                POST A DRAWING
              </button>

              {/* Drawings Gallery */}
              {game.customArt && game.customArt.length > 0 && (
                <div className="mt-4 pt-4 border-t border-retro-border">
                  <p className="font-arcade text-xs text-neon-purple mb-2">DRAWINGS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {game.customArt.slice(0, 3).map((art) => (
                      <div key={art.id} className="relative aspect-square rounded overflow-hidden group">
                        <Image
                          src={art.imageUrl}
                          alt="Drawing"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => handleDeleteArt(art.id)}
                          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Art Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="retro-card neon-border-pink p-6 max-w-md w-full">
            <h3 className="font-pixel text-lg neon-text-pink mb-4">
              POST A DRAWING
            </h3>
            <p className="font-arcade text-sm text-gray-400 mb-4">
              {selectedGame.name}
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
                    setSelectedGame(null);
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
