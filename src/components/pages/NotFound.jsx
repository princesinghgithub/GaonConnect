import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';

// Vercel rewrites every unmatched path to index.html with a 200 status, so
// without this catch-all route, unknown URLs (dead links, bot-guessed paths)
// rendered a blank page that still carried the homepage's indexable meta
// tags. SeoCanonical noindexes any path not in its known-routes list, so
// this component just needs to give those URLs real, honest content.
const NotFound = () => {
  const handleDownloadApp = () => {
    alert('🎉 Coming soon!');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 flex flex-col">
      <Navbar onDownloadApp={handleDownloadApp} />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="text-7xl mb-4">🧭</div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink dark:text-white mb-3">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Ye page maujood nahi hai ya move ho gaya hai.
        </p>
        <Link
          to="/"
          className="inline-flex bg-saffron hover:bg-cta text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          Home par jaayein
        </Link>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
