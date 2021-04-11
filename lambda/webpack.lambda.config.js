const path = require('path');

module.exports = {
  entry: './src/api.ts',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'api.js',
    library: "index",
    libraryTarget: "umd",
  },
  externals: [],
  target: 'node',

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}
