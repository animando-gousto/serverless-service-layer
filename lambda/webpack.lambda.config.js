const path = require('path');
const fs = require('fs')

const lambdaSrc = './src/lambda'
const entry = fs.readdirSync(path.resolve(__dirname, lambdaSrc)).reduce((acc, f) => {
  const name = f.substring(0, f.lastIndexOf('.'))
  return {
    ...acc,
    [name]: `${lambdaSrc}/${f}`
  }
}, {})

module.exports = {
  entry,
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
