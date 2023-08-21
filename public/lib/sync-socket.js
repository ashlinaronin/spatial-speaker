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

let connectedClients = [];
const clientChangeListeners = [];

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

socket.on("connectedClients", (newClients) => {
  console.log("connectedClients from server", newClients);
  connectedClients = newClients;

  clientChangeListeners.forEach((listener) => {
    listener(newClients);
  });
});

const registerClientChangeListener = (callback) => {
  if (typeof callback === "function") {
    clientChangeListeners.push(callback);
  }
};

export {
  socket,
  syncClient,
  connectedClients,
  registerClientChangeListener,
};
