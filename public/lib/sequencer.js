import { getClientId } from "./getClientId.js";

// inspired by https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
const TOTAL_STEPS = 16;

const SAMPLE_OFFSET = 0.08; // seems to account for the click of the button and pick up once user actually started speaking

// todo eventually use other ppls sounds too
export const setupSequencer = () => {
  Tone.Transport.bpm.value = 40;

  // create data structure to hold steps and fill with player for each step
  const clientId = getClientId();
  const nameSampleUrl = `uploads/${clientId}_RECORD_NAME.ogg`;
  const playbackRate = 3.0;
  const steps = Array(TOTAL_STEPS)
    .fill(null)
    .map(() => {
      const player = new Tone.GrainPlayer(nameSampleUrl, () => {
        // note for slow rates need to increase overlap to get realistic result
        player.playbackRate = playbackRate;
      });
      player.toDestination();

      return {
        sample: nameSampleUrl,
        player,
      };
    });

  let currentStepIndex = 0;

  const configLoop = () => {
    // callback that will execute repeatedly when called by Tone
    const repeat = (time) => {
      const currentStep = steps[currentStepIndex];
      if (!!currentStep) {
        // early return if not loaded yet
        if (!currentStep.player.loaded) return;

        // play sample for a 16th note
        currentStep.player.start(time, SAMPLE_OFFSET, "16n");
      }

      // increment step index
      currentStepIndex = (currentStepIndex + 1) % TOTAL_STEPS;
    };

    Tone.Transport.start();
    Tone.Transport.scheduleRepeat(repeat, "8n");
  };

  configLoop();
};

export const stopSequencer = () => {
  Tone.Transport.stop();
};
