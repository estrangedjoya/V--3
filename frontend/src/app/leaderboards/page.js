'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState('artists'); // artists or games
  const [artistsLeaderboard, setArtistsLeaderboard] = useState([]);
  const [gamesLeaderboard, setGamesLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const [artistsRes, gamesRes] = await Promise.all([
        axios.get(`${API_URL}/leaderboard/artists`, { params: { limit: 20 } }),
        axios.get(`${API_URL}/leaderboard/games`, { params: { limit: 20 } })
      ]);
      setArtistsLeaderboard(artistsRes.data);
      setGamesLeaderboard(gamesRes.data);
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-pixel text-3xl neon-text-pink mb-8">LEADERBOARDS</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('artists')}
          className={`font-arcade text-sm py-3 px-6 border transition-colors ${
            activeTab === 'artists'
              ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
              : 'border-retro-border text-gray-400 hover:border-neon-cyan'
          }`}
        >
          TOP ARTISTS
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`font-arcade text-sm py-3 px-6 border transition-colors ${
            activeTab === 'games'
              ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
              : 'border-retro-border text-gray-400 hover:border-neon-pink'
          }`}
        >
          TOP GAMES
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="font-arcade text-gray-500">LOADING...</p>
        </div>
      ) : activeTab === 'artists' ? (
        <div className="retro-card neon-border-cyan p-6">
          <h2 className="font-pixel text-xl neon-text-cyan mb-6">
            TOP ARTISTS BY LIKES
          </h2>
          {artistsLeaderboard.length === 0 ? (
            <p className="font-arcade text-sm text-gray-500 text-center py-8">
              NO DATA YET
            </p>
          ) : (
            <div className="space-y-4">
              {artistsLeaderboard.map((artist, index) => (
                <Link
                  key={artist.id}
                  href={`/users/${artist.username}`}
                  className="flex items-center gap-4 p-4 bg-retro-darker border border-retro-border hover:border-neon-cyan transition-colors rounded"
                >
                  <div className={`font-pixel text-2xl flex-shrink-0 w-12 text-center ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-retro-bg border border-neon-purple flex items-center justify-center flex-shrink-0">
                    <span className="font-pixel text-lg text-neon-purple">
                      {artist.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-arcade text-sm text-neon-cyan truncate">
                      @{artist.username}
                    </p>
                    <p className="font-arcade text-xs text-gray-500 mt-1">
                      {artist.totalDrawings} drawings • {artist.totalLikes} total likes
                    </p>
                  </div>
                  <div className="font-pixel text-lg text-neon-pink flex-shrink-0">
                    ♥ {artist.totalLikes}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="retro-card neon-border-purple p-6">
          <h2 className="font-pixel text-xl neon-text-pink mb-6">
            TOP RATED GAMES
          </h2>
          {gamesLeaderboard.length === 0 ? (
            <p className="font-arcade text-sm text-gray-500 text-center py-8">
              NO DATA YET
            </p>
          ) : (
            <div className="space-y-4">
              {gamesLeaderboard.map((game, index) => (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="flex items-center gap-4 p-4 bg-retro-darker border border-retro-border hover:border-neon-pink transition-colors rounded"
                >
                  <div className={`font-pixel text-2xl flex-shrink-0 w-12 text-center ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    #{index + 1}
                  </div>
                  {game.imageUrl && (
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={game.imageUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-arcade text-sm text-neon-pink truncate">
                      {game.name}
                    </p>
                    <p className="font-arcade text-xs text-gray-500 mt-1">
                      {game.totalReviews} reviews
                    </p>
                  </div>
                  <div className="font-pixel text-lg text-neon-cyan flex-shrink-0">
                    ★ {game.averageRating.toFixed(1)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
