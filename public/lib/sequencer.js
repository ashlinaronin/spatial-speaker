import { getClientId, getTeamId } from "./getClientId.js";
import {
  socket,
  syncClient,
  registerStepChangeListener,
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

let sequencerSteps = Array(16)
  .fill(null)
  .map((val, index) => ({ teamId: index % NUM_TEAMS, clientPlayers: [] })); // clientPlayers is array of { clientId, player }

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
const gain = new Tone.Gain(180);
const reverb = new Tone.Reverb(0.2);
const chorus = new Tone.Chorus(4, 2.5, 0.5);
const delay = new Tone.FeedbackDelay("8n", 0.5);
compressor.connect(gain);
gain.connect(chorus);
chorus.connect(reverb);
reverb.connect(delay);
delay.toDestination();

let phaseMapping = serverPhaseArray.find((p) => p.index === serverPhase);
const onServerPhaseChange = (newServerPhase) => {
  if (newServerPhase === phaseMapping.index) return; // don't do unnecessary work every time the phase is broadcast

  // update cached phaseMapping
  phaseMapping = serverPhaseArray.find((p) => p.index === newServerPhase);
  duration = phaseMapping.duration;

  sequencerSteps.forEach((step) => {
    if (step.clientPlayers.length > 0) {
      step.clientPlayers.forEach(({ player }) => {
        player.playbackRate = phaseMapping.playbackRate;
        player.grainSize = phaseMapping.grainSize;
        player.loop = phaseMapping.loop;
        player.overlap = phaseMapping.overlap;
        player.reverse = phaseMapping.reverse;
      });
    }
  });

  // todo make this nicer when consolidating phase concepts, please...
  if (newServerPhase === 4) {
    setLocalPhase(2); // server phase 4 is end, local phase 2 is end
  } else {
    setLocalPhase(1); // back to sequencer
  }
};

const onStepsChange = (newServerSteps) => {
  const thisTeamId = getTeamId();
  // loop through all the sequencer steps and see if there are any players that need to be added or remoed
  newServerSteps.forEach(({ teamId, clients }, stepIndex) => {
    // find players that shouldn't be here and dispose them
    const seqStep = sequencerSteps[stepIndex];

    const badPlayers = seqStep.clientPlayers.filter(
      (cp) => !clients.some((c) => c.clientId === cp.clientId)
    );

    badPlayers.forEach(({ clientId }) => {
      const bpIndex = seqStep.clientPlayers.findIndex(
        (cp) => cp.clientId === clientId
      );
      seqStep.clientPlayers[bpIndex].player.stop();
      seqStep.clientPlayers[bpIndex].player.dispose();
      seqStep.clientPlayers.splice(bpIndex, 1);
      console.log("seq:removing player for ", clientId);
      console.log("seq:now seqStep", seqStep);
    });

    // add players that aren't here yet
    const newPlayers = clients.filter(
      (c) =>
        teamId === thisTeamId &&
        !seqStep.clientPlayers.some((cp) => cp.clientId === c.clientId)
    );
    newPlayers.forEach(({ clientId }) => {
      const player = new Tone.GrainPlayer({
        url: `uploads/${clientId}_RECORD_NAME.ogg`,
        volume: 1,
        playbackRate: phaseMapping.playbackRate,
        grainSize: phaseMapping.grainSize,
        loop: phaseMapping.loop,
        overlap: phaseMapping.overlap,
        reverse: phaseMapping.reverse,
      });
      player.connect(compressor);
      seqStep.clientPlayers.push({ clientId, player });
      console.log("seq:adding player for ", clientId);
      console.log("seq:now seqStep", seqStep);
    });
  });
};

const ACCEL_LOW_INPUT = 0;
const ACCEL_HI_INPUT = 10;
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
    -100,
    100
  );

  const newVerb = scale(
    Math.abs(latestMovement.motionX),
    ACCEL_LOW_INPUT,
    ACCEL_HI_INPUT,
    0.1,
    1.0
  );

  const newDelay = scale(
    Math.abs(latestMovement.motionX),
    ACCEL_LOW_INPUT,
    ACCEL_HI_INPUT,
    0.0,
    1.2
  );

  delay.delayTime.rampTo(newDelay, 0.05);

  reverb.decay = newVerb;

  sequencerSteps.forEach(({ clientPlayers }) => {
    clientPlayers.forEach(({ player }) => {
      player.detune = newDetune;
    });
  });
}, SENSOR_READ_MS);

// register listeners
registerStepChangeListener(onStepsChange);
registerServerPhaseChangeListener(onServerPhaseChange);

export const setupSequencer = async () => {
  // const metronome = new Tone.Player(
  //   "./lib/268822__kwahmah_02__woodblock.wav"
  // ).toDestination();

  await reverb.ready;

  socket.on("tick", ({ beatDivisionNumber, serverTime, teamId }) => {
    // if this phase doesn't involve playing sound, bail
    if (!phaseMapping.play) return;

    const timeToPlay = syncClient.getLocalTime(serverTime);
    const step = sequencerSteps[beatDivisionNumber];

    if (!step) {
      console.log("step not found, skipping");
      return;
    }

    step.clientPlayers.forEach(({ clientId, player }) => {
      if (!player.loaded) return;

      console.log(
        `${getClientId()}: team ${teamId} scheduling ${beatDivisionNumber} at ${timeToPlay} based on serverTime ${serverTime}, duration = ${duration}, sample from clientId ${clientId}`
      );
      timeEl.innerText = `${beatDivisionNumber}:: ${timeToPlay}:: ${serverTime}:: ${duration}`;

      // play sample
      player.start(timeToPlay, SAMPLE_OFFSET, duration);
    });
  });

  Tone.Transport.start();
};

export const stopSequencer = () => {
  Tone.Transport.stop();
};
