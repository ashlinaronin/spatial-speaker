module.exports = (io, socket, syncServer) => {
  socket.on("gong", () => {
    console.log("received gong msg, emitting");
    io.emit("gong", { serverTime: syncServer.getSyncTime() + 2 });
  });
};
