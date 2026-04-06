/**
 * videoUtils.js
 * Parses external video URLs to extract provider, video ID, embed URL,
 * and thumbnail URL. Add new providers to PROVIDERS to extend support.
 */

const PROVIDERS = {
  youtube: {
    patterns: [
      // Standard: youtube.com/watch?v=ID
      /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([a-zA-Z0-9_-]{11})/,
      // Short: youtu.be/ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // Embed: youtube.com/embed/ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Shorts: youtube.com/shorts/ID
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ],
    getEmbedUrl: (id) =>
      `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
    getThumbnailUrl: (id) =>
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    canEmbed: true,
  },

  vimeo: {
    patterns: [
      // Standard: vimeo.com/ID
      /(?:vimeo\.com\/)(\d+)/,
      // Player: player.vimeo.com/video/ID
      /(?:player\.vimeo\.com\/video\/)(\d+)/,
    ],
    getEmbedUrl: (id) =>
      `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    getThumbnailUrl: () => null, // Requires Vimeo API — not needed for basic embed
    canEmbed: true,
  },
};

/**
 * Parse a video URL and return structured metadata.
 *
 * @param {string} url
 * @returns {{
 *   provider: 'youtube'|'vimeo'|'other',
 *   videoId: string|null,
 *   embedUrl: string|null,
 *   thumbnailUrl: string|null,
 *   canEmbed: boolean,
 *   originalUrl: string,
 * }}
 */
export function parseVideoUrl(url) {
  if (!url || typeof url !== "string") {
    return {
      provider: "other",
      videoId: null,
      embedUrl: null,
      thumbnailUrl: null,
      canEmbed: false,
      originalUrl: url || "",
    };
  }

  for (const [provider, config] of Object.entries(PROVIDERS)) {
    for (const pattern of config.patterns) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[1];
        return {
          provider,
          videoId,
          embedUrl: config.getEmbedUrl(videoId),
          thumbnailUrl: config.getThumbnailUrl(videoId),
          canEmbed: config.canEmbed,
          originalUrl: url,
        };
      }
    }
  }

  // Unknown provider — just link out
  return {
    provider: "other",
    videoId: null,
    embedUrl: null,
    thumbnailUrl: null,
    canEmbed: false,
    originalUrl: url,
  };
}

/**
 * Returns true if the URL belongs to a supported embeddable provider.
 */
export function isEmbeddable(url) {
  return parseVideoUrl(url).canEmbed;
}
