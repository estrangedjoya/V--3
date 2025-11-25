'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function ArtDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [art, setArt] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArt();
    fetchComments();
  }, [id]);

  const fetchArt = async () => {
    try {
      const response = await axios.get(`${API_URL}/art/${id}`, {
        params: { userId: user?.id }
      });
      setArt(response.data);
    } catch (err) {
      console.error('Error fetching art:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/art/${id}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (art.isLiked) {
        await axios.delete(`${API_URL}/art/${id}/like`, {
          headers: getAuthHeaders()
        });
      } else {
        await axios.post(`${API_URL}/art/${id}/like`, {}, {
          headers: getAuthHeaders()
        });
      }
      fetchArt();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/art/${id}/comments`, {
        content: newComment
      }, {
        headers: getAuthHeaders()
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: getAuthHeaders()
      });
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <p className="font-arcade text-gray-500">LOADING...</p>
      </div>
    );
  }

  if (!art) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <p className="font-arcade text-gray-500">ART NOT FOUND</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="font-arcade text-sm text-neon-cyan hover:text-neon-pink mb-6 inline-block">
        ← BACK
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="retro-card neon-border-purple overflow-hidden">
          <div className="relative w-full aspect-square">
            <Image
              src={art.imageUrl}
              alt="Drawing"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Artist Info */}
          <div className="retro-card neon-border-cyan p-6">
            <h2 className="font-pixel text-xl neon-text-pink mb-4">ARTIST</h2>
            <Link
              href={`/users/${art.author.username}`}
              className="font-arcade text-neon-cyan hover:text-neon-pink"
            >
              @{art.author.username}
            </Link>
            <p className="font-arcade text-xs text-gray-500 mt-2">
              {new Date(art.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Game Info */}
          <div className="retro-card neon-border-purple p-6">
            <h2 className="font-pixel text-xl neon-text-cyan mb-4">GAME</h2>
            <Link
              href={`/game/${art.game.apiId}`}
              className="font-arcade text-neon-pink hover:text-neon-cyan"
            >
              {art.game.name}
            </Link>
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`w-full font-arcade text-sm py-3 border transition-colors ${
              art.isLiked
                ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                : 'border-retro-border text-gray-400 hover:border-neon-pink hover:text-neon-pink'
            }`}
          >
            {art.isLiked ? '♥' : '♡'} {art.likes} LIKES
          </button>

          {/* Tags */}
          {art.tags && (
            <div className="retro-card neon-border-cyan p-4">
              <p className="font-arcade text-xs text-gray-400">
                Tags: {art.tags}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-12">
        <h2 className="font-pixel text-2xl neon-text-pink mb-6">
          COMMENTS ({comments.length})
        </h2>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="retro-card neon-border-purple p-6 mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-retro-darker border border-retro-border text-white font-arcade text-sm p-4 rounded resize-none focus:outline-none focus:border-neon-cyan"
              rows="3"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="mt-4 font-arcade text-sm py-2 px-6 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-retro-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'POSTING...' : 'POST COMMENT'}
            </button>
          </form>
        ) : (
          <div className="retro-card neon-border-purple p-6 mb-8 text-center">
            <p className="font-arcade text-sm text-gray-400 mb-4">
              Log in to comment
            </p>
            <Link href="/auth" className="retro-btn text-xs py-2 px-6">
              LOGIN
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="retro-card neon-border-cyan p-6 text-center">
              <p className="font-arcade text-sm text-gray-500">
                NO COMMENTS YET
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="retro-card neon-border-cyan p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/users/${comment.author.username}`}
                      className="font-arcade text-sm text-neon-cyan hover:text-neon-pink"
                    >
                      @{comment.author.username}
                    </Link>
                    <p className="font-arcade text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                    <p className="font-arcade text-sm text-white mt-3">
                      {comment.content}
                    </p>
                  </div>
                  {user && user.id === comment.authorId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="font-arcade text-xs text-red-500 hover:text-red-400 ml-4"
                    >
                      DELETE
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
