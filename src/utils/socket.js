let io;

module.exports = {
  init: (socketIo) => {
    io = socketIo;
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  getTradingNamespace: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io.of('/trading');
  }
};
