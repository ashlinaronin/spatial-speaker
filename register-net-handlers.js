module.exports = (io, socket, syncServer) => {
    socket.on("gong", () => {
      console.log("received gong msg, emitting");
      io.emit("gong", { serverTime: syncServer.getSyncTime() + 5 });
    });

//   const tempo = 15;
//   let current16thNote = 0;
//   let futureTickTime = syncServer.getSyncTime();
//   const secondsPerBeat = 60.0 / tempo;

//   const futureTick = () => {
//     futureTickTime += secondsPerBeat;
//     current16thNote = (current16thNote + 1) % 16;
//   };

//   const scheduleNote = (beatDivisionNumber, time) => {
//     console.log(`scheduling tick ${beatDivisionNumber} at`, time + 5);
//     io.emit("tick", { beatDivisionNumber, serverTime: time + 5 });
//   };

//   const seqInterval = setInterval(() => {
//     while (futureTickTime < syncServer.getSyncTime() + 0.1) {
//       scheduleNote(current16thNote, futureTickTime);
//       futureTick();
//     }
//   }, 200);
};
