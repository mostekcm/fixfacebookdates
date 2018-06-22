require('babel-core/register')({
  ignore: /node_modules/,
  sourceMaps: !(process.env.NODE_ENV === 'production')
});

require('babel-polyfill');

require('./src');