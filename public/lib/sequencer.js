import { getClientId } from "./getClientId.js";
import {
  socket,
  syncClient,
  registerClientChangeListener,
  registerServerPhaseChangeListener,
  serverPhase,
} from "./sync-socket.js";
import { serverPhaseArray } from "./serverPhaseNameMap.js";

const teamIdEl = document.querySelector("#team-id");

// inspired by https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
const NUM_TEAMS = 4;
const SAMPLE_OFFSET = 0.08; // seems to account for the click of the button and pick up once user actually started speaking

const steps = Array(16)
  .fill(null)
  .map((val, index) => ({ teamId: index % NUM_TEAMS, player: null }));

// set up basic signal chain
const compressor = new Tone.Compressor(-30, 3);
const reverb = new Tone.Reverb(0.2);
compressor.connect(reverb);
reverb.toDestination();

let phaseMapping = serverPhaseArray.find((p) => p.index === serverPhase);
const onServerPhaseChange = (newServerPhase) => {
  // update cached phaseMapping
  phaseMapping = serverPhaseArray.find((p) => p.index === newServerPhase);

  steps.forEach((step) => {
    if (step.player) {
      step.player.playbackRate = phaseMapping.playbackRate;
      step.player.loop = phaseMapping.loop;
      step.player.overlap = phaseMapping.overlap;
      step.player.reverse = phaseMapping.reverse;
    }
  });
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
          volume: 16,
          playbackRate: phaseMapping.playbackRate,
          loop: phaseMapping.loop,
          overlap: phaseMapping.overlap,
          reverse: true,
        });
        player.connect(compressor);
        step.player = player;
      }
    });
  });
};

// register listeners
registerClientChangeListener(onConnectedClientsChange);
registerServerPhaseChangeListener(onServerPhaseChange);

export const setupSequencer = async () => {
  // const metronome = new Tone.Player(
  //   "./lib/268822__kwahmah_02__woodblock.wav"
  // ).toDestination();

  await reverb.ready;

  socket.on("tick", ({ beatDivisionNumber, serverTime }) => {
    const timeToPlay = syncClient.getLocalTime(serverTime);
    const step = steps[beatDivisionNumber];
    if (!!step.player) {
      // early return if not loaded yet
      if (!step.player.loaded) return;

      // play sample

      step.player.start(timeToPlay, SAMPLE_OFFSET, phaseMapping.duration);
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
