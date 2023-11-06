const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/ts/main.ts',  // path to your main TypeScript file
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',  // output bundle file
    path: path.resolve(__dirname, 'docs', 'dist'),  // output directory
  },
};