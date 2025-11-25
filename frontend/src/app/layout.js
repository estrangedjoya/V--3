import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'V~ | Video Game Tracker & Art Database',
  description: 'Track your games, share custom art, connect with gamers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen grid-bg">
        <Navbar />
        <main className="pt-20 px-4 pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
