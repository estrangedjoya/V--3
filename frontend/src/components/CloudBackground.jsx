'use client';

import { useEffect, useState } from 'react';

export default function CloudBackground() {
  const [clouds, setClouds] = useState([]);

  useEffect(() => {
    // Generate random clouds
    const cloudArray = [];
    const numClouds = 8;

    for (let i = 0; i < numClouds; i++) {
      cloudArray.push({
        id: i,
        width: Math.random() * 100 + 80, // 80-180px
        height: Math.random() * 40 + 40, // 40-80px
        top: Math.random() * 70 + 5, // 5-75% from top
        duration: Math.random() * 40 + 60, // 60-100s
        delay: Math.random() * 20, // 0-20s delay
        opacity: Math.random() * 0.3 + 0.5, // 0.5-0.8
      });
    }

    setClouds(cloudArray);
  }, []);

  return (
    <div className="clouds-bg">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            top: `${cloud.top}%`,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
            opacity: cloud.opacity,
          }}
        />
      ))}

      {/* Sun in the corner */}
      <div
        className="absolute top-12 right-12 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-80"
        style={{
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.6)',
        }}
      >
        {/* Sun rays */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-16 bg-yellow-300 opacity-40"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
              transformOrigin: 'center',
              borderRadius: '999px',
            }}
          />
        ))}
      </div>
    </div>
  );
}
