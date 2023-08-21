module.exports = (socket, io, syncServer) => {
  // the `receiveFunction` and `sendFunction` functions aim at abstracting
  // the transport layer between the SyncServer and the SyncClient
  const receiveFunction = (callback) => {
    socket.on("ircam", ({ isPing, pingId, clientPingTime }) => {
      console.log("received ircam", pingId, clientPingTime);
      if (isPing) {
        callback(pingId, clientPingTime);
      }
    });
  };

  const sendFunction = (
    pingId,
    clientPingTime,
    serverPingTime,
    serverPongTime
  ) => {
    console.log(
      "sending ircam",
      pingId,
      clientPingTime,
      serverPingTime,
      serverPongTime
    );

    socket.emit("ircam", {
      isPing: false,
      pingId,
      clientPingTime,
      serverPingTime,
      serverPongTime,
    });
  };

  syncServer.start(sendFunction, receiveFunction);
};
