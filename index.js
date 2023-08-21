const path = require("path");
const fsPromises = require("fs/promises");
const Hapi = require("@hapi/hapi");
const Joi = require("@hapi/joi");
const inert = require("@hapi/inert");
const socketIo = require("socket.io");
const { SyncServer } = require("@ircam/sync");
const { registerUser, addRecording } = require("./db");
const registerNetHandlers = require("./register-net-handlers");
const registerMovementHandlers = require("./register-movement-handlers");
const registerSyncHandlers = require("./register-sync-handlers");

const startTime = process.hrtime();
const getTimeFunction = () => {
  const now = process.hrtime(startTime);
  return now[0] + now[1] * 1e-9;
};
const syncServer = new SyncServer(getTimeFunction);

// track team ids we're assigning to make them sequential
let currentTeamId = 0;

const connectedClientIds = [];

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
    path: "/register",
    handler: async function (request, h) {
      const { clientId } = request.payload;
      const teamId = currentTeamId;
      currentTeamId++;

      console.log(`registering clientId ${clientId} with team ${teamId}`);
      registerUser(clientId, teamId);

      return { success: true };
    },
    options: {
      validate: {
        payload: Joi.object({
          clientId: Joi.string(),
        }),
      },
    },
  });

  server.route({
    method: "POST",
    path: "/recording/{clientId}",
    handler: async function (request, h) {
      const { clientId } = request.params;

      const uploadName = request.payload.file.filename;
      const uploadPath = request.payload.file.path;
      const destination = path.join(__dirname, "public/uploads", uploadName);
      console.log("destination", destination);

      console.log(
        `received file for clientId ${clientId} with uploadName ${uploadName}`
      );

      try {
        await fsPromises.rename(uploadPath, destination);
      } catch (err) {
        console.error("fs error", err);
      }

      addRecording(clientId, uploadName, destination);

      return { success: true };
    },
    options: {
      payload: {
        output: "file",
        parse: true,
        multipart: true,
        uploads: path.join(__dirname, "public/uploads"),
      },
    },
  });

  io.on("connection", (socket) => {
    const clientId = socket.handshake.query.clientId;
    console.log(`clientId ${clientId} joined`);
    registerSyncHandlers(io, socket, syncServer);
    registerNetHandlers(io, socket, syncServer);
    registerMovementHandlers(io, socket);
    connectedClientIds.push(clientId);
    io.emit("connectedClientIds", connectedClientIds);

    socket.on("disconnect", () => {
      const clientIdIndex = connectedClientIds.indexOf(socket.handshake.query.clientId);
      if (clientIdIndex > -1) {
        connectedClientIds.splice(clientIdIndex, 1);
      }
      io.emit("connectedClientIds", connectedClientIds);
    })
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
