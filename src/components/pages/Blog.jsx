import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';

const postImages = [
  '/gaonconnect1.png',
  '/gaonconnect2.png',
  '/gaonconenct3.png',
  '/gaonconenct4.png',
  '/gaonconnect5.png',
  '/gaonconnect6.png',
];

const Blog = () => {
  const { t } = useTranslation();
  const posts = t('blogPage.posts', { returnObjects: true }).map((post, i) => ({
    ...post,
    image: postImages[i],
  }));

  const handleDownloadApp = () => {
    alert(`🎉 ${t('download.comingSoon')}\n\n${t('download.promo')}`);
  };

  const handleReadMore = (title) => {
    alert(`📝 "${title}"\n\n${t('blogPage.readMoreAlert')}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('blogPage.heroTitle')}</h1>
          <p className="text-base md:text-lg opacity-95 max-w-2xl mx-auto leading-relaxed">
            {t('blogPage.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.title}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-6 flex flex-col flex-1">
                <span className="inline-block w-fit text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 dark:bg-gray-700 text-saffron dark:text-orange-400 mb-4">
                  {post.tag}
                </span>
                <h3 className="text-lg font-semibold mb-2 text-ink dark:text-white leading-snug">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1">{post.excerpt}</p>
                <button
                  onClick={() => handleReadMore(post.title)}
                  className="text-saffron dark:text-orange-400 font-medium text-sm text-left hover:underline"
                >
                  {t('blogPage.readMore')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
