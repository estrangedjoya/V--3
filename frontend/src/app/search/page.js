'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('games'); // games or users
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      if (searchType === 'games') {
        const response = await axios.get(`${API_URL}/search`, {
          params: { query: searchQuery }
        });
        setResults(response.data.results || []);
      } else {
        const response = await axios.get(`${API_URL}/search/users`, {
          params: { q: searchQuery }
        });
        setResults(response.data);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-pixel text-3xl neon-text-pink mb-8">SEARCH</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="retro-card neon-border-purple p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setSearchType('games')}
            className={`font-arcade text-sm py-2 px-4 border transition-colors ${
              searchType === 'games'
                ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                : 'border-retro-border text-gray-400 hover:border-neon-cyan'
            }`}
          >
            GAMES
          </button>
          <button
            type="button"
            onClick={() => setSearchType('users')}
            className={`font-arcade text-sm py-2 px-4 border transition-colors ${
              searchType === 'users'
                ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                : 'border-retro-border text-gray-400 hover:border-neon-pink'
            }`}
          >
            USERS
          </button>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${searchType}...`}
            className="flex-1 bg-retro-darker border border-retro-border text-white font-arcade text-sm p-3 rounded focus:outline-none focus:border-neon-cyan"
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="font-arcade text-sm py-3 px-8 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-retro-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'SEARCHING...' : 'SEARCH'}
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20">
          <p className="font-arcade text-gray-500">SEARCHING...</p>
        </div>
      ) : hasSearched ? (
        results.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-arcade text-gray-500">NO RESULTS FOUND</p>
          </div>
        ) : searchType === 'games' ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((game) => (
              <Link
                key={game.id}
                href={`/game/${game.id}`}
                className="retro-card neon-border-cyan hover:border-neon-pink transition-colors overflow-hidden group"
              >
                <div className="relative w-full aspect-square bg-retro-darker">
                  {game.image?.medium_url && (
                    <img
                      src={game.image.medium_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-arcade text-sm text-white truncate">
                    {game.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.username}`}
                className="retro-card neon-border-purple hover:border-neon-pink transition-colors p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-retro-darker border border-neon-purple flex items-center justify-center flex-shrink-0">
                    <span className="font-pixel text-2xl text-neon-purple">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-arcade text-lg text-neon-cyan">
                      @{user.username}
                    </h3>
                    {user.bio && (
                      <p className="font-arcade text-xs text-gray-400 mt-1 truncate">
                        {user.bio}
                      </p>
                    )}
                    <p className="font-arcade text-xs text-gray-500 mt-2">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20">
          <p className="font-arcade text-gray-500">
            SEARCH FOR {searchType.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
