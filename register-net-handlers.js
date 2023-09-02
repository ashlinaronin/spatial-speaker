const { setPhase } = require("./phase");

module.exports = (io, socket, syncServer) => {
  socket.on("gong", () => {
    console.log("received gong msg, emitting");
    io.emit("gong", { serverTime: syncServer.getSyncTime() + 5 });
  });

  socket.on("phase", ({ phaseId }) => {
    console.log("received message to change phase to", phaseId);
    setPhase(phaseId);
    // broadcast updated phase so clients can change accordingly
    io.emit("phase", { phaseId });
  });
};
