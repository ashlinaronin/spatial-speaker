import SyncClient from "./ircam-client-converted.js";
const socket = io();

// return the local time in seconds
// const getTimeFunction = () => performance.now() / 1000;
const getTimeFunction = () => Tone.now();

// init sync client
const syncClient = new SyncClient(getTimeFunction);

socket.on("connect", () => {
    const sendFunction = (pingId, clientPingTime) => {
        socket.emit("ircam", { isPing: true, pingId, clientPingTime });
    };

    const receiveFunction = callback => {
        socket.on("ircam", ({ isPing, pingId, clientPingTime, serverPingTime, serverPongTime }) => {
            if (!isPing) {
                callback(pingId, clientPingTime, serverPingTime, serverPongTime);
            }
        });
    };

    // check the synchronization status, when this function is called for the 
    // first time, you can consider the synchronization process properly 
    // initiated.
    const statusFunction = status => console.log(status);
    // start synchronization process
    syncClient.start(sendFunction, receiveFunction, statusFunction);
});


// monitor the synchronized clock
// setInterval(() => {
//     const syncTime = syncClient.getSyncTime();
//     // console.log(syncTime);
// }, 100);


export { socket, syncClient };