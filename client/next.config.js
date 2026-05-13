/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Foursquare Places API photo CDN
        protocol: 'https',
        hostname: 'fastly.4sqi.net',
        pathname: '/img/**',
      },
      {
        // Foursquare alternate CDN
        protocol: 'https',
        hostname: '*.foursquare.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
