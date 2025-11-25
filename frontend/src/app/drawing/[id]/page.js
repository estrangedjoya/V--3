'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

// Common device sizes for downloads
const DOWNLOAD_SIZES = [
  { name: 'Phone Portrait', width: 1080, height: 1920, label: '1080x1920' },
  { name: 'Phone Landscape', width: 1920, height: 1080, label: '1920x1080' },
  { name: 'Desktop HD', width: 1920, height: 1080, label: '1920x1080' },
  { name: 'Desktop 2K', width: 2560, height: 1440, label: '2560x1440' },
  { name: 'Desktop 4K', width: 3840, height: 2160, label: '3840x2160' },
  { name: 'Tablet', width: 2048, height: 2732, label: '2048x2732' },
  { name: 'Original', width: 0, height: 0, label: 'Full Size' },
];

export default function DrawingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, getAuthHeaders } = useStore();
  const [drawing, setDrawing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrawing();
  }, [id]);

  const fetchDrawing = async () => {
    try {
      const response = await axios.get(`${API_URL}/art/${id}`, {
        params: { userId: user?.id }
      });
      setDrawing(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drawing');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      if (drawing.isLiked) {
        await axios.delete(`${API_URL}/art/${id}/like`, {
          headers: getAuthHeaders()
        });
      } else {
        await axios.post(`${API_URL}/art/${id}/like`, {}, {
          headers: getAuthHeaders()
        });
      }
      setDrawing({
        ...drawing,
        likes: drawing.isLiked ? drawing.likes - 1 : drawing.likes + 1,
        isLiked: !drawing.isLiked
      });
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDownload = async (size) => {
    if (!drawing) return;

    // For original size, just download the image directly
    if (size.width === 0) {
      const link = document.createElement('a');
      link.href = drawing.imageUrl;
      link.download = `${drawing.game?.name || 'drawing'}_original.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // For resized images, we'll use canvas to resize
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext('2d');

      // Calculate crop dimensions to maintain aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = size.width / size.height;

      let sx, sy, sw, sh;
      if (imgAspect > targetAspect) {
        // Image is wider - crop sides
        sh = img.height;
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        // Image is taller - crop top/bottom
        sw = img.width;
        sh = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size.width, size.height);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${drawing.game?.name || 'drawing'}_${size.label}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    };
    img.src = drawing.imageUrl;
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

  if (error || !drawing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-pixel text-xl text-neon-pink">
          {error || 'DRAWING NOT FOUND'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="font-arcade text-sm px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-all mb-6"
      >
        ← BACK
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Drawing */}
        <div className="md:col-span-2">
          <div className="retro-card neon-border-purple p-4">
            <div className="relative aspect-square rounded overflow-hidden">
              <Image
                src={drawing.imageUrl}
                alt="Fan drawing"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <span
                onClick={() => router.push(`/users/${drawing.author?.username}`)}
                className="font-arcade text-sm text-neon-cyan cursor-pointer hover:text-neon-pink transition-colors"
              >
                by {drawing.author?.username}
              </span>
              <span
                onClick={() => router.push(`/game/${drawing.game?.apiId}`)}
                className="font-arcade text-xs text-gray-400 cursor-pointer hover:text-neon-cyan transition-colors"
              >
                {drawing.game?.name}
              </span>
            </div>
            <button
              onClick={handleLike}
              className={`font-arcade text-sm flex items-center gap-2 px-4 py-2 border transition-colors ${
                drawing.isLiked
                  ? 'border-neon-pink text-neon-pink'
                  : 'border-gray-500 text-gray-500 hover:border-neon-pink hover:text-neon-pink'
              }`}
            >
              <span className="text-lg">{drawing.isLiked ? '♥' : '♡'}</span>
              {drawing.likes} {drawing.likes === 1 ? 'LIKE' : 'LIKES'}
            </button>
          </div>
        </div>

        {/* Right Column - Download Options */}
        <div className="md:col-span-1">
          <div className="retro-card neon-border-cyan p-6">
            <h2 className="font-pixel text-lg neon-text-cyan mb-6">DOWNLOAD</h2>
            <div className="space-y-3">
              {DOWNLOAD_SIZES.map((size) => (
                <button
                  key={size.name}
                  onClick={() => handleDownload(size)}
                  className="w-full font-arcade text-xs py-3 px-4 border border-retro-border text-gray-400 hover:border-neon-purple hover:text-neon-purple transition-colors text-left flex justify-between items-center group"
                >
                  <span>{size.name}</span>
                  <span className="text-gray-600 group-hover:text-neon-purple">
                    {size.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="font-arcade text-xs text-gray-600 mt-4 leading-relaxed">
              Images are cropped to fit the selected size without scaling
            </p>
          </div>

          {/* Game link */}
          <button
            onClick={() => router.push(`/game/${drawing.game?.apiId}`)}
            className="w-full mt-4 retro-btn"
          >
            VIEW GAME
          </button>
        </div>
      </div>
    </div>
  );
}
