// Pexels API Service
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

/**
 * Search for images on Pexels related to accessibility and job platform
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of image objects with url and photographer info
 */
export const searchPexelsImages = async (query) => {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=3&page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return data.photos || [];
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
    return [];
  }
};

/**
 * Get curated images from Pexels
 * @returns {Promise<Array>} Array of curated image objects
 */
export const getCuratedImages = async () => {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key not configured');
    return [];
  }

  try {
    const response = await fetch(`${PEXELS_BASE_URL}/curated?per_page=5&page=1`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return data.photos || [];
  } catch (error) {
    console.error('Error fetching curated images:', error);
    return [];
  }
};

/**
 * Get app-specific image based on context
 * Maps user queries to relevant accessibility/job platform themes
 */
export const getAppContextImage = async (category) => {
  const queryMap = {
    jobSearch: 'accessible job workplace',
    profile: 'professional person working',
    accommodations: 'accessibility workplace',
    employers: 'diverse team collaboration',
    help: 'friendly support assistance',
    privacy: 'secure protection data',
    apply: 'job application success',
    deafHoH: 'deaf accessibility sign language',
    signLanguage: 'sign language interpreter',
    greetings: 'welcoming diverse workplace'
  };

  const query = queryMap[category] || 'accessibility employment';
  const images = await searchPexelsImages(query);
  return images[0] || null;
};

/**
 * Format image object for UI display
 * @param {Object} image - Pexels image object
 * @returns {Object} Formatted image with safe properties
 */
export const formatImageForDisplay = (image) => {
  if (!image) return null;

  return {
    url: image.src?.medium || image.src?.small,
    alt: `${image.alt} - Photo by ${image.photographer}`,
    photographer: image.photographer,
    photographerUrl: image.photographer_url,
    title: image.alt,
  };
};
