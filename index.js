const path = require("path");
const fsPromises = require("fs/promises");
const Hapi = require("@hapi/hapi");
const inert = require("@hapi/inert");
const socketIo = require("socket.io");
const { SyncServer } = require("@ircam/sync");

const startTime = process.hrtime();
const getTimeFunction = () => {
  const now = process.hrtime(startTime);
  return now[0] + now[1] * 1e-9;
};

const movementEvents = {};

const ACC_THRESHOLD = 5.0;
const EVENT_BUFFER_LENGTH = 500;
const REFRESH_RATE = 200;
const BUFFER_CLEANUP_MS = EVENT_BUFFER_LENGTH * REFRESH_RATE;

const getUtcTimestamp = () => new Date().getTime();

//
const syncServer = new SyncServer(getTimeFunction);

const init = async () => {
  const server = Hapi.server({
    port: 3333,
    host: "localhost",
    routes: {
      files: {
        relativeTo: path.join(__dirname, "public"),
      },
    },
  });

  const io = socketIo(server.listener, { path: "/spatial-socket/" });

  await server.register(inert);

  server.route({
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: ".",
        redirectToSlash: true,
        index: true,
      },
    },
  });

  // trying for deployed...
  server.route({
    method: "GET",
    path: "/lib/{param*}",
    handler: {
      directory: {
        path: "lib",
      },
    },
  });

  server.route({
    method: "GET",
    path: "/spatial-speaker/lib/{param*}",
    handler: {
      directory: {
        path: "lib",
      },
    },
  });

  server.route({
    method: "POST",
    path: "/recording/{clientId}",
    handler: async function (request, h) {
      console.log("request", request);

      const { clientId } = request.params;
      console.log("received file for clientId ", clientId);

      const uploadName = request.payload.file.filename;
      const uploadPath = request.payload.file.path;
      const destination = path.join(__dirname, "uploads", uploadName);

      try {
        await fsPromises.rename(uploadPath, destination);
      } catch (err) {
        console.error("fs error", err);
      }

      return "success";
    },
    options: {
      payload: {
        output: "file",
        parse: true,
        multipart: true,
        uploads: path.join(__dirname, "uploads"),
      },
    },
  });

  io.on("connection", (socket) => {
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

    socket.on("gong", () => {
      console.log("received gong msg, emitting");
      io.emit("gong", { serverTime: syncServer.getSyncTime() + 2 });
    });

    socket.on("movement", (movementEvent) => {
      //   console.log("received movement event from phone", movementEvent);
      const {
        clientId,
        timestamp,
        latitude,
        longitude,
        motionX,
        motionY,
        motionZ,
        orientationAlpha,
        orientationBeta,
        orientationGamma,
      } = movementEvent;

      // uniquely identify device
      // append to map sorted by timestamp, so latest is always at the end

      // if we don't have any events for this client yet, initialize an array of them
      if (!movementEvents[clientId]) {
        movementEvents[clientId] = [];
      }

      // if buffer is full, take one off the beginning to add space
      if (movementEvents[clientId].length === EVENT_BUFFER_LENGTH) {
        movementEvents[clientId].shift();
      }

      movementEvents[clientId].push(movementEvent);

      // send all movement events
      io.emit("movementEvents", movementEvents);

      if (
        motionX > ACC_THRESHOLD ||
        motionY > ACC_THRESHOLD ||
        motionZ > ACC_THRESHOLD
      ) {
        console.log("acc over threshold, sending gong");
        io.emit("gong", { serverTime: syncServer.getSyncTime() + 2 });
      }
    });
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

const bufferCleanupInterval = setInterval(() => {
  const now = getUtcTimestamp();

  const clientIdsOlderThanCleanup = Object.entries(movementEvents)
    .filter(([, events]) =>
      events.filter((e) => now - e[e.length - 1]?.timestamp < BUFFER_CLEANUP_MS)
    )
    .map(([clientId]) => clientId);

  clientIdsOlderThanCleanup.forEach((clientId) => {
    movementEvents[clientId] = [];
    delete movementEvents[clientId];
  });
}, BUFFER_CLEANUP_MS);

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
