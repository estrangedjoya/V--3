'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import useStore from '@/app/store';

const API_URL = 'https://v-e40n.onrender.com/api';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password,
        });
        const user = { id: response.data.userId, username: response.data.username };
        login(user, response.data.token);
        router.push('/profile');
      } else {
        await axios.post(`${API_URL}/register`, formData);
        // After registration, log them in
        const loginResponse = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password,
        });
        const user = { id: loginResponse.data.userId, username: loginResponse.data.username };
        login(user, loginResponse.data.token);
        router.push('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Title */}
        <h1 className="font-pixel text-3xl text-center mb-8 glitch" data-text={isLogin ? 'LOGIN' : 'REGISTER'}>
          <span className="neon-text-cyan">{isLogin ? 'LOGIN' : 'REGISTER'}</span>
        </h1>

        {/* Form Card */}
        <div className="retro-card neon-border-purple p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block font-arcade text-xs text-neon-cyan mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="retro-input"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block font-arcade text-xs text-neon-cyan mb-2">
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="retro-input"
                required
              />
            </div>

            <div>
              <label className="block font-arcade text-xs text-neon-cyan mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="retro-input"
                required
              />
            </div>

            {error && (
              <div className="text-neon-pink font-arcade text-xs text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="retro-btn w-full disabled:opacity-50"
            >
              {loading ? 'LOADING...' : isLogin ? 'LOGIN' : 'REGISTER'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-arcade text-xs text-gray-400 hover:text-neon-pink transition-colors"
            >
              {isLogin ? 'Need an account? REGISTER' : 'Have an account? LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
