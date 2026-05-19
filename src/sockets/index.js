const marketSocket = require('./market.socket');

module.exports = (io) => {
  marketSocket(io);
};
