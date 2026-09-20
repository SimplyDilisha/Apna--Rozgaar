import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Loader2, Library, GraduationCap, ArrowRight, Star } from 'lucide-react';
import { getGroqBookRecommendations } from '../services/groqService';
import { AccessibleButton } from '../components/AccessibleButton';
import { announceToScreenReader } from '../utils/a11y';

const LibraryPage = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    announceToScreenReader(`Searching for books related to ${topic}`);

    try {
      const results = await getGroqBookRecommendations(topic);
      setBooks(books => results && Array.isArray(results) ? results : []);
      announceToScreenReader(`Found ${results?.length || 0} books for ${topic}`);
    } catch (error) {
      console.error(error);
      setBooks([]);
      announceToScreenReader('An error occurred while finding books');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('beginner')) return 'var(--success)';
    if (l.includes('intermediate')) return '#eab308'; // yellow-500
    if (l.includes('advanced')) return 'var(--error)';
    return 'var(--accent-purple)';
  };

  return (
    <div className="library-container page-transition" style={{ minHeight: 'calc(100vh - var(--header-height))', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '12px 24px',
            borderRadius: '24px',
            marginBottom: '20px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <Library size={24} color="var(--accent-purple)" style={{ marginRight: '12px' }} />
            <span style={{ color: 'var(--accent-purple)', fontWeight: '600', letterSpacing: '1px' }}>AI LIBRARY</span>
          </div>

          <h1 style={{
            fontSize: 'var(--hero-title)',
            marginBottom: '16px',
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            Discover Your Next Book
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Type in any course, subject, or topic you want to master, and Astra AI will recommend the best books to read.
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{ maxWidth: '800px', margin: '0 auto 60px' }}
        >
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              padding: '8px',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }} className="search-wrapper">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., Quantum Physics, React Development, Stock Market..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '16px 24px',
                  fontSize: '1.1rem',
                  color: 'black',
                  outline: 'none',
                  minWidth: '0'
                }}
                aria-label="Search for a topic or course"
              />
              <AccessibleButton
                type="submit"
                disabled={isLoading || !topic.trim()}
                style={{
                  minWidth: '130px',
                  borderRadius: '14px',
                  padding: '0 30px',
                  fontSize: '1.1rem',
                  opacity: (isLoading || !topic.trim()) ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spin" aria-hidden="true" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search size={20} aria-hidden="true" />
                    Find Books
                  </>
                )}
              </AccessibleButton>
            </div>
          </form>
        </motion.div>

        {/* Results Section */}
        {hasSearched && (
          <div style={{ position: 'relative' }}>
            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: '20px'
              }}>
                <Loader2 size={48} color="var(--accent-purple)" className="spin" />
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Analyzing billions of pages to find the best books for you...</p>
              </div>
            ) : books.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '30px',
                  paddingBottom: '40px'
                }}
              >
                {books.map((book, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '20px',
                      padding: '30px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="book-card-hover"
                  >
                    {/* Decorative glow */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'var(--primary-gradient)',
                      opacity: 0.7
                    }}></div>

                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '12px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BookOpen size={28} color="var(--accent-purple)" />
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${getLevelColor(book.level)}20`, /* 20 is small opacity */
                        color: getLevelColor(book.level),
                        border: `1px solid ${getLevelColor(book.level)}40`,
                        position: 'absolute',
                        right: 0
                      }}>
                        {book.level || 'All Levels'}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.4rem',
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {book.title}
                    </h3>

                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '1rem',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ opacity: 0.6 }}>by</span>
                      <span style={{ color: 'black', fontWeight: '500' }}>{book.author}</span>
                    </p>

                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        marginBottom: '20px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {book.description}
                      </p>
                    </div>

                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginTop: 'auto',
                      borderLeft: '3px solid var(--accent-purple)',
                      width: '100%',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <GraduationCap size={16} color="var(--accent-purple)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>Why read this?</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                        {book.whyToRead}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '12px' }}>No Recommendations Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '24px' }}>
                  We couldn't find any books for this specific topic right now. Try different keywords!
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Put this in index.css or here directly */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .book-card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .search-wrapper:focus-within {
          border-color: var(--accent-purple);
          box-shadow: 0 8px 30px var(--accent-purple-glow);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default LibraryPage;
