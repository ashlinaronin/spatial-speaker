import { getClientId } from "./getClientId.js";
import { getLatestMovement } from "./sensors.js";
import scale from "./scale.js";

let player;
let latestMovement;

const SENSOR_READ_MS = 200;

export const setupDualResonator = () => {
  const clientId = getClientId();
  const nameSampleUrl = `uploads/${clientId}_RECORD_NAME.ogg`;
  const playbackRate = 3.0;
  const filterCutoffOne = 6000;
  const filterCuttoffRatio = 0.3;
  const filterQ = 0.8;
  const filterCutoffTwo = filterCutoffOne * filterCuttoffRatio;
  const crossfadeValue = 0.8;

  // loop timestretched sample
  player = new Tone.GrainPlayer(nameSampleUrl, () => {
    player.loop = true;
    // note for slow rates need to increase overlap to get realistic result
    player.playbackRate = playbackRate;
    player.start();
  });

  // * create dual peak resonant filter
  const lowResOne = new Tone.Filter({
    frequency: filterCutoffOne,
    type: "lowpass",
    Q: filterQ,
  });
  const lowResTwo = new Tone.Filter({
    frequency: filterCutoffTwo,
    type: "lowpass",
    Q: filterQ,
  });
  const combinedFilter = new Tone.Subtract();
  const reverb = new Tone.Reverb();
  player.connect(lowResOne);
  player.connect(lowResTwo);
  lowResOne.connect(combinedFilter);
  lowResTwo.connect(combinedFilter.subtrahend);
  combinedFilter.connect(reverb);

  // * create dry/wet fader to resonated/reverb version
  const crossFade = new Tone.CrossFade();
  player.connect(crossFade.a);
  reverb.connect(crossFade.b);
  crossFade.fade.value = crossfadeValue;
  crossFade.toDestination();

  // * drive parameters based on mvmt
  const sensorReadInterval = setInterval(() => {
    latestMovement = getLatestMovement();
    const newFilterCutOffOne = scale(latestMovement.motionX, -10, 10, 2000, 12000);
    lowResOne.frequency.linearRampTo(newFilterCutOffOne, 0.1);

    const newPlaybackRate = scale(latestMovement.motionY, -10, 10, 1.0, 20.0);
    player.playbackRate = newPlaybackRate;
  }, SENSOR_READ_MS);
};

export const stopPlayer = () => {
  player.stop();
};
