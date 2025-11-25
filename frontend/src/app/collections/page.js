'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function CollectionsPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API_URL}/collections`, {
        headers: getAuthHeaders()
      });
      setCollections(response.data);
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollection.name.trim()) return;

    setCreating(true);
    try {
      await axios.post(`${API_URL}/collections`, newCollection, {
        headers: getAuthHeaders()
      });
      setShowCreateModal(false);
      setNewCollection({ name: '', description: '', isPublic: true });
      fetchCollections();
    } catch (err) {
      console.error('Error creating collection:', err);
      alert('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('Delete this collection?')) return;

    try {
      await axios.delete(`${API_URL}/collections/${collectionId}`, {
        headers: getAuthHeaders()
      });
      fetchCollections();
    } catch (err) {
      console.error('Error deleting collection:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <p className="font-arcade text-gray-500">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-pixel text-3xl neon-text-pink">MY COLLECTIONS</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="retro-btn text-xs py-2 px-6"
        >
          + NEW COLLECTION
        </button>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="retro-card neon-border-purple p-8 max-w-lg w-full">
            <h2 className="font-pixel text-xl neon-text-cyan mb-6">
              CREATE COLLECTION
            </h2>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="font-arcade text-xs text-gray-400 block mb-2">
                  NAME
                </label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  className="w-full bg-retro-darker border border-retro-border text-white font-arcade text-sm p-3 rounded focus:outline-none focus:border-neon-cyan"
                  placeholder="Best RPGs..."
                />
              </div>
              <div>
                <label className="font-arcade text-xs text-gray-400 block mb-2">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  className="w-full bg-retro-darker border border-retro-border text-white font-arcade text-sm p-3 rounded resize-none focus:outline-none focus:border-neon-cyan"
                  rows="3"
                  placeholder="My favorite RPG games..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newCollection.isPublic}
                  onChange={(e) => setNewCollection({ ...newCollection, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="font-arcade text-xs text-gray-400">
                  PUBLIC COLLECTION
                </label>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={creating || !newCollection.name.trim()}
                  className="flex-1 font-arcade text-sm py-3 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-retro-darker transition-colors disabled:opacity-50"
                >
                  {creating ? 'CREATING...' : 'CREATE'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 font-arcade text-sm py-3 border border-retro-border text-gray-400 hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="retro-card neon-border-cyan p-12 text-center">
          <p className="font-arcade text-gray-500 mb-4">NO COLLECTIONS YET</p>
          <p className="font-arcade text-xs text-gray-600">
            Create your first collection to organize games!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="retro-card neon-border-purple p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link
                    href={`/collections/${collection.id}`}
                    className="font-arcade text-lg text-neon-cyan hover:text-neon-pink"
                  >
                    {collection.name}
                  </Link>
                  {collection.description && (
                    <p className="font-arcade text-xs text-gray-400 mt-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="font-arcade text-xs text-gray-500 mt-2">
                    {collection.games.length} games • {collection.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCollection(collection.id)}
                  className="font-arcade text-xs text-red-500 hover:text-red-400 ml-4"
                >
                  DELETE
                </button>
              </div>

              {/* Game Thumbnails */}
              {collection.games.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {collection.games.slice(0, 4).map((cg) => (
                    <div key={cg.game.id} className="relative aspect-square rounded overflow-hidden bg-retro-darker">
                      {cg.game.imageUrl && (
                        <Image
                          src={cg.game.imageUrl}
                          alt={cg.game.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
