'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useStore from '@/app/store';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-retro-darker/95 backdrop-blur-sm border-b-2 border-neon-purple">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-pixel text-2xl neon-text-pink">V~</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
            >
              Search
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
                >
                  Library
                </Link>
                <Link
                  href={`/users/${user.username}`}
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/messages"
                  className="font-arcade text-sm text-gray-300 hover:text-neon-cyan transition-colors"
                >
                  Messages
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-arcade text-sm text-neon-pink hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="retro-btn text-xs py-2 px-4"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
