const path = require("path");
const fsPromises = require("fs/promises");
const Hapi = require("@hapi/hapi");
const Joi = require("@hapi/joi");
const inert = require("@hapi/inert");
const socketIo = require("socket.io");
const { SyncServer } = require("@ircam/sync");
const eiows = require("eiows");
const { registerUser, addRecording, getUser } = require("./db");
const registerNetHandlers = require("./register-net-handlers");
const registerMovementHandlers = require("./register-movement-handlers");
const registerSyncHandlers = require("./register-sync-handlers");
const serverPhaseNameMap = require("./serverPhaseNameMap");
const { registerPhaseChangeListener, getPhase } = require("./phase");
const getStepsFromClients = require("./getStepsFromClients");

const startTime = process.hrtime();
const getTimeFunction = () => {
  const now = process.hrtime(startTime);
  return now[0] + now[1] * 1e-9;
};
const syncServer = new SyncServer(getTimeFunction);

// track team ids we're assigning to make them sequential
const NUMBER_OF_TEAMS = 4;
const SEQUENCER_STEPS = 16;

let currentTeamId = 0;

let steps = [];
const connectedClients = [];
const addClientToList = async (clientId) => {
  // we don't know this user's teamId yet, so we have to fetch them from the db first
  const user = await getUser(clientId);
  const teamId = user.teamId;
  connectedClients.push({
    clientId,
    teamId,
    joinedTimestamp: getTimeFunction(),
  });
  steps = getStepsFromClients(
    connectedClients,
    SEQUENCER_STEPS,
    NUMBER_OF_TEAMS
  );
  console.log("after client added, steps", steps);
};
const removeClientFromList = (clientId) => {
  const clientIndex = connectedClients.findIndex(
    (client) => client.clientId === clientId
  );
  if (clientIndex > -1) {
    connectedClients.splice(clientIndex, 1);
  }
  steps = getStepsFromClients(
    connectedClients,
    SEQUENCER_STEPS,
    NUMBER_OF_TEAMS
  );
  console.log("after client left, steps", steps);
};

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

  const io = socketIo(server.listener, {
    path: "/spatial-socket/",
    wsEngine: eiows.Server,
  });

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
      currentTeamId = (currentTeamId + 1) % NUMBER_OF_TEAMS;

      console.log(`registering clientId ${clientId} with team ${teamId}`);
      registerUser(clientId, teamId);

      return { clientId, teamId };
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

  const PHASE_STEP_BROADCAST_INTERVAL_MS = 6000;

  const LOOKAHEAD_SECONDS = 2.0;
  let bpm = 30;
  let current16thNote = 0;
  let futureTickTime = syncServer.getSyncTime();

  registerPhaseChangeListener((newPhase) => {
    if (newPhase === serverPhaseNameMap.drone) {
      bpm = 2;
    } else {
      bpm = 30;
    }
    console.log(`phase change to ${newPhase}, new bpm is ${bpm}`);
  });

  const advanceTick = () => {
    const secondsPerBeat = 60.0 / bpm;
    futureTickTime += 0.25 * secondsPerBeat;
    current16thNote = (current16thNote + 1) % SEQUENCER_STEPS;
  };

  const scheduleNote = (beatDivisionNumber, time) => {
    const step = steps[beatDivisionNumber];

    console.log(
      `scheduling tick ${beatDivisionNumber} at ${time} with teamId ${
        step?.teamId
      } and clientIds ${step?.clients?.map(({ clientId }) => clientId)}`,
      time
    );

    io.emit("tick", {
      beatDivisionNumber,
      serverTime: time,
      teamId: step?.teamId,
      clients: step?.clients,
    });
  };

  const seqInterval = setInterval(() => {
    // schedule further in future due to latency
    while (futureTickTime < syncServer.getSyncTime() + LOOKAHEAD_SECONDS) {
      scheduleNote(current16thNote, futureTickTime);
      advanceTick();
    }
  }, 50);

  const phaseAndStepInterval = setInterval(() => {
    // send phase and step periodically so that any newly connected clients get lined up
    console.log("emitting phase", getPhase());
    io.emit("phase", { phaseId: getPhase() });
    io.emit("steps", steps);
  }, PHASE_STEP_BROADCAST_INTERVAL_MS);

  io.on("connection", async (socket) => {
    const clientId = socket.handshake.query.clientId;

    if (!clientId) {
      console.log("no clientId, probably a controller. ignoring");
      // we still want to register net handlers for controller - but we don't need movement or sync
      registerNetHandlers(io, socket, syncServer);
      return;
    }

    console.log(`clientId ${clientId} joined`);
    registerSyncHandlers(io, socket, syncServer);
    registerNetHandlers(io, socket, syncServer);
    registerMovementHandlers(io, socket, syncServer);
    await addClientToList(clientId);
    io.emit("connectedClients", connectedClients);
    io.emit("steps", steps);

    socket.on("disconnect", () => {
      removeClientFromList(socket.handshake.query.clientId);
      io.emit("connectedClients", connectedClients);
      io.emit("steps", steps);
    });
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
