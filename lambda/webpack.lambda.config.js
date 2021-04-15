const path = require('path');

module.exports = {
  entry: {
    api: './src/api.ts',
    auth: './src/auth.ts',
    addUser: './src/addUser.ts',
    getUsers: './src/getUsers.ts',
    requestToken: './src/requestToken.ts',
    validateToken: './src/validateToken.ts',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
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
