import { getClientId } from "./getClientId.js";
import {
  socket,
  syncClient,
  registerClientChangeListener,
  registerServerPhaseChangeListener,
  serverPhase,
} from "./sync-socket.js";
import { getLatestMovement } from "./sensors.js";
import { serverPhaseArray } from "./serverPhaseNameMap.js";
import scale from "./scale.js";
import { setLocalPhase } from "./phases.js";

const teamIdEl = document.querySelector("#team-id");
const timeEl = document.querySelector("#time");
const motionOutEl = document.querySelector("#motion-out");

// inspired by https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
const NUM_TEAMS = 4;
const SAMPLE_OFFSET = 0.15; // seems to account for the click of the button and pick up once user actually started speaking

const steps = Array(4)
  .fill(null)
  .map((val, index) => ({ teamId: index % NUM_TEAMS, player: null }));

// keep one var for performance
let latestMovement;

// set up basic signal chain
const compressor = new Tone.Compressor({
  attack: 0.007,
  knee: 5.2,
  ratio: 7.88,
  release: 1,
  threshold: -33,
});
const gain = new Tone.Gain(4);
const reverb = new Tone.Reverb(0.2);
compressor.connect(gain);
gain.connect(reverb);
reverb.toDestination();

let phaseMapping = serverPhaseArray.find((p) => p.index === serverPhase);
const onServerPhaseChange = (newServerPhase) => {
  if (newServerPhase === phaseMapping.index) return; // don't do unnecessary work every time the phase is broadcast

  // update cached phaseMapping
  phaseMapping = serverPhaseArray.find((p) => p.index === newServerPhase);
  duration = phaseMapping.duration;

  steps.forEach((step) => {
    if (step.player) {
      step.player.playbackRate = phaseMapping.playbackRate;
      step.player.grainSize = phaseMapping.grainSize;
      step.player.loop = phaseMapping.loop;
      step.player.overlap = phaseMapping.overlap;
      step.player.reverse = phaseMapping.reverse;
    }
  });

  // todo make this nicer when consolidating phase concepts, please...
  if (newServerPhase === 4) {
    setLocalPhase(2); // server phase 4 is end, local phase 2 is end
  } else {
    setLocalPhase(1); // back to sequencer
  }
};

const onConnectedClientsChange = (newClients) => {
  // wait a tick- decouple from event?
  setTimeout(() => {
    const thisClientId = getClientId();
    const thisClient = newClients.find(
      (client) => client.clientId === thisClientId
    );
    const thisTeamId = thisClient?.teamId;

    if (typeof thisTeamId !== "number") {
      console.log("this client not found in connected clients list");
      return;
    }

    // todo do this on load instead of here?
    teamIdEl.textContent = `teamId: ${thisTeamId}`;

    // pick 4 clients for this team for the appropriate beats
    // later decide how to handle more than 16 ppl
    const newClientsWithMatchingTeamId = newClients
      .filter((client) => client.teamId === thisTeamId)
      .slice(0, 4);
    const stepsToUpdate = steps.filter((step) => step.teamId === thisTeamId);

    // create data structure to hold steps and fill with player for each step
    newClientsWithMatchingTeamId.forEach(({ clientId }, index) => {
      const step = stepsToUpdate[index];

      if (!step.player) {
        const player = new Tone.GrainPlayer({
          url: `uploads/${clientId}_RECORD_NAME.ogg`,
          volume: 120,
          playbackRate: phaseMapping.playbackRate,
          grainSize: phaseMapping.grainSize,
          loop: phaseMapping.loop,
          overlap: phaseMapping.overlap,
          reverse: phaseMapping.reverse,
        });
        player.connect(compressor);
        step.player = player;
      }
    });
  });
};

const ACCEL_LOW_INPUT = 0;
const ACCEL_HI_INPUT = 10;
const DETUNE_LOW = -100;
const DETUNE_HI = 100;
const DURATION_LOW = 100;
const DURATION_HI = 2000;
const OVERLAP_LOW = 1;
const OVERLAP_HI = 3;
const SENSOR_READ_MS = 200;

let duration = phaseMapping.duration;

const sensorReadInterval = setInterval(() => {
  latestMovement = getLatestMovement();

  // if we don't have any movement data, don't try to map it
  if (typeof latestMovement.motionY !== "number") return;

  motionOutEl.textContent = `${latestMovement.motionX}, ${latestMovement.motionY}, ${latestMovement.motionZ}`;

  // if this phase mapping is not meant to use these params, bail
  if (!phaseMapping.applyMotion) return;

  const newDetune = scale(
    Math.abs(latestMovement.motionY),
    ACCEL_LOW_INPUT,
    ACCEL_HI_INPUT,
    DETUNE_LOW,
    DETUNE_HI
  );

  const newOverlap = scale(
    Math.abs(latestMovement.motionZ),
    ACCEL_LOW_INPUT,
    ACCEL_HI_INPUT,
    OVERLAP_LOW,
    OVERLAP_HI
  );

  const newDuration = scale(
    Math.abs(latestMovement.motionX),
    ACCEL_LOW_INPUT,
    ACCEL_HI_INPUT,
    DURATION_LOW,
    DURATION_HI
  );

  // duration = newDuration; // beware that this overrides the phase specific duration...
  // so maybe we should only apply it in phases 0,1? trying all for now

  steps.forEach((step) => {
    if (step.player) {
      step.player.detune = newDetune;
      step.player.overlap = newOverlap;
    }
  });
}, SENSOR_READ_MS);

// register listeners
registerClientChangeListener(onConnectedClientsChange);
registerServerPhaseChangeListener(onServerPhaseChange);

export const setupSequencer = async () => {
  // const metronome = new Tone.Player(
  //   "./lib/268822__kwahmah_02__woodblock.wav"
  // ).toDestination();

  await reverb.ready;

  socket.on("tick", ({ beatDivisionNumber, serverTime }) => {
    // if this phase doesn't involve playing sound, bail
    if (!phaseMapping.play) return;

    const timeToPlay = syncClient.getLocalTime(serverTime);
    const step = steps[beatDivisionNumber];
    if (!!step.player) {
      // early return if not loaded yet
      if (!step.player.loaded) return;

      // play sample
      console.log(
        `scheduling ${beatDivisionNumber} at ${timeToPlay} based on serverTime ${serverTime}, duration = ${duration}`
      );
      timeEl.innerText = `${beatDivisionNumber}:: ${timeToPlay}:: ${serverTime}:: ${duration}`;

      step.player.start(timeToPlay, SAMPLE_OFFSET, duration);
    } else {
      // play metronome on non-occupied beats, for debugging. disabled for now
      //   if (!metronome.loaded) return;
      //   metronome.start(timeToPlay, null, "16n");
    }
  });

  Tone.Transport.start();
};

export const stopSequencer = () => {
  Tone.Transport.stop();
};
