import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white font-sans">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-6xl font-extrabold mb-6 animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
          UNITED NAMELESS
        </h1>
        <p className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto">
          Your Community Activity Partner. Earn points by talking, achieve goals, and get rewarded for your contribution.
        </p>

        <div className="flex justify-center gap-6">
          <Link href="/leaderboard">
            <button className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition transform hover:scale-105 shadow-lg">
              View Leaderboard
            </button>
          </Link>
          <a href="https://discord.com/" target="_blank" rel="noopener noreferrer">
            <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition transform hover:scale-105 shadow-lg">
              Add to Discord
            </button>
          </a>
        </div>
      </header>

      {/* Stats Preview Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-yellow-400/50 transition">
            <h3 className="text-2xl font-bold mb-4 text-yellow-300">Economy</h3>
            <p className="text-gray-300">
              Earn points by chatting and active participation. Trade, shop, and climb the ranks.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-pink-400/50 transition">
            <h3 className="text-2xl font-bold mb-4 text-pink-300">Activity Milestones</h3>
            <p className="text-gray-300">
              Unlock rewards as you contribute. Visualize your community presence with rank cards.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-indigo-400/50 transition">
            <h3 className="text-2xl font-bold mb-4 text-indigo-300">Security</h3>
            <p className="text-gray-300">
              Advanced anti-nuke protection and audit logging keep your community safe.
            </p>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 text-center text-gray-500 border-t border-white/10">
        &copy; {new Date().getFullYear()} UNITED NAMELESS. All rights reserved.
      </footer>
    </div>
  );
}
