module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          stream: require.resolve('stream-browserify'),
          assert: require.resolve('assert'),
          buffer: require.resolve('buffer'),
          process: require.resolve('process/browser'),
          url: require.resolve('url/'),
        },
      },
    },
  },
}; 