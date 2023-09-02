import { getClientId } from "./getClientId.js";
import {
  socket,
  syncClient,
  registerClientChangeListener,
} from "./sync-socket.js";

// inspired by https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
const TOTAL_STEPS = 16;
const NUM_TEAMS = 4;
const SAMPLE_OFFSET = 0.08; // seems to account for the click of the button and pick up once user actually started speaking
const PLAYBACK_RATE = 3.0; // note for slow rates need to increase overlap to get realistic result

const players = {};
let currentStepIndex = 0;
const steps = Array(16)
  .fill(null)
  .map((val, index) => ({ teamId: index % NUM_TEAMS, player: null }));

const onConnectedClientsChange = (newClients) => {
  console.log("newClients in sequencer", newClients);

  const thisClientId = getClientId();
  const thisClient = newClients.find(
    (client) => client.clientId === thisClientId
  );
  const thisTeamId = thisClient.teamId;

  // todo do this on load instead of here?
  const teamIdEl = document.querySelector("#team-id");
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
      const nameSampleUrl = `uploads/${clientId}_RECORD_NAME.ogg`;
      const player = new Tone.GrainPlayer(nameSampleUrl, () => {
        player.playbackRate = PLAYBACK_RATE;
      });
      player.toDestination();
      step.player = player;
    }
  });
};
registerClientChangeListener(onConnectedClientsChange);

export const setupSequencer = () => {
  const metronome = new Tone.Player(
    "./lib/268822__kwahmah_02__woodblock.wav"
  ).toDestination();

  socket.on("tick", ({ beatDivisionNumber, serverTime }) => {
    console.log(
      `received tick event with beatDivisionNumber ${beatDivisionNumber} and serverTime ${serverTime}`
    );

    const localTime = syncClient.getLocalTime();
    const syncTime = syncClient.getSyncTime();
    const timeToPlay = syncClient.getLocalTime(serverTime);

    console.log("serverTime from event", serverTime);
    console.log("localTime", localTime);
    console.log("syncTime", syncTime);
    console.log("timeToPlay", timeToPlay);

    const step = steps[beatDivisionNumber];
    if (!!step.player) {
      // early return if not loaded yet
      if (!step.player.loaded) return;

      // play sample for a 16th note
      step.player.start(timeToPlay, SAMPLE_OFFSET, "16n");
    } else {
      // play metronome on non-occupied beats, for debugging. disabled for now
      //   if (!metronome.loaded) return;
      //   metronome.start(timeToPlay, null, "16n");
    }
  });

  Tone.Transport.bpm.value = 40;
  Tone.Transport.start();
};

export const stopSequencer = () => {
  Tone.Transport.stop();
};
