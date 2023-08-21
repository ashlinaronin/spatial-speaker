import { getClientId } from "./getClientId.js";
import SyncClient from "./ircam-client-converted.js";

const socket = io("", {
  path: "/spatial-socket/",
  query: {
    clientId: getClientId(),
  },
});

// return the local time in seconds
const getTimeFunction = () => Tone.now();

// init sync client
const syncClient = new SyncClient(getTimeFunction);

let connectedClientIds = [];

const sendFunction = (pingId, clientPingTime) => {
  socket.emit("ircam", { isPing: true, pingId, clientPingTime });
};

const receiveFunction = (callback) => {
  socket.on(
    "ircam",
    ({ isPing, pingId, clientPingTime, serverPingTime, serverPongTime }) => {
      if (!isPing) {
        callback(pingId, clientPingTime, serverPingTime, serverPongTime);
      }
    }
  );
};

socket.on("connect", () => {
  // check the synchronization status, when this function is called for the
  // first time, you can consider the synchronization process properly
  // initiated.
  const statusFunction = (status) => console.log(status);
  // start synchronization process
  syncClient.start(sendFunction, receiveFunction, statusFunction);
});

socket.on("connectedClientIds", (newIds) => {
  console.log("connectedClientIds from server", newIds);
  connectedClientIds = newIds;
});

export { socket, syncClient, connectedClientIds };
