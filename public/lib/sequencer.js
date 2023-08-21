import { getClientId } from "./getClientId.js";
import { registerClientChangeListener } from "./sync-socket.js";

// inspired by https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
const TOTAL_STEPS = 16;
const SAMPLE_OFFSET = 0.08; // seems to account for the click of the button and pick up once user actually started speaking
const PLAYBACK_RATE = 3.0; // note for slow rates need to increase overlap to get realistic result

const players = {};
let currentStepIndex = 0;
// todo: generate dynamically
// rn they correspond to the teamId
const steps = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];

// will have to add some listeners so that when new ppl connect and disconnect the seqs get updated
const onConnectedClientsChange = (newClients) => {
  console.log("newClients in sequencer", newClients);

  // create data structure to hold steps and fill with player for each step
  newClients.forEach(({ clientId, teamId }) => {
    // if this team doesnt have a sample player yet, make one
    // later we will figure out what to do with more than one person per team
    if (!players[teamId]) {
      const nameSampleUrl = `uploads/${clientId}_RECORD_NAME.ogg`;
      const player = new Tone.GrainPlayer(nameSampleUrl, () => {
        player.playbackRate = PLAYBACK_RATE;
      });
      player.toDestination();

      players[teamId] = player;
    }
  });
};
registerClientChangeListener(onConnectedClientsChange);

// todo eventually use other ppls sounds too
export const setupSequencer = () => {
  // callback that will execute repeatedly when called by Tone
  const repeat = (time) => {
    const currentStepTeamId = steps[currentStepIndex];
    const player = players[currentStepTeamId];
    if (!!player) {
      // early return if not loaded yet
      if (!player.loaded) return;

      // play sample for a 16th note
      player.start(time, SAMPLE_OFFSET, "16n");
    }

    // increment step index
    currentStepIndex = (currentStepIndex + 1) % TOTAL_STEPS;
  };

  Tone.Transport.bpm.value = 40;
  Tone.Transport.start();
  Tone.Transport.scheduleRepeat(repeat, "8n");
};

export const stopSequencer = () => {
  Tone.Transport.stop();
};
