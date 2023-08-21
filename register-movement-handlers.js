const EVENT_BUFFER_LENGTH = 500;
const REFRESH_RATE = 200;
const BUFFER_CLEANUP_MS = EVENT_BUFFER_LENGTH * REFRESH_RATE;
const ACC_THRESHOLD = 5.0;
const movementEvents = {};

const getUtcTimestamp = () => new Date().getTime();

const cleanupStaleEvents = () => {
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
};

const handleMovementEvent = (movementEvent, io) => {
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
};

module.exports = (io, socket) => {
  socket.on("movement", (movementEvent) =>
    handleMovementEvent(movementEvent, io)
  );
  setInterval(cleanupStaleEvents, BUFFER_CLEANUP_MS);
};
