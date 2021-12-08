const path = require('path');

module.exports = {
  // mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist/js'),
    filename: 'index.js',
    library: 'mathematica',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      { test: /\.css$/, use: 'css-loader' },
    ],
  },
};