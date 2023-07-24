import { getClientId } from "./getClientId.js";

let player;

export const setupDualResonator = () => {
  const clientId = getClientId();
  const nameSampleUrl = `uploads/${clientId}_RECORD_NAME.ogg`;
  const filterCutoffOne = 6000;
  const filterCuttoffRatio = 0.3;
  const filterCutoffTwo = filterCutoffOne * filterCuttoffRatio;

  // loop timestretched sample
  player = new Tone.GrainPlayer(nameSampleUrl, () => {
    player.loop = true;
    // note for slow rates need to increase overlap to get realistic result
    player.playbackRate = 3;
    player.start();
  });

  // * create dual peak resonant filter
  const lowResOne = new Tone.Filter({
    frequency: filterCutoffOne,
    type: "lowpass",
    Q: 0.8,
  });
  const lowResTwo = new Tone.Filter({
    frequency: filterCutoffTwo,
    type: "lowpass",
    Q: 0.8,
  });
  const combinedFilter = new Tone.Subtract();
  const reverb = new Tone.Reverb();
  player.connect(lowResOne);
  player.connect(lowResTwo);
  lowResOne.connect(combinedFilter);
  lowResTwo.connect(combinedFilter.subtrahend);
  combinedFilter.connect(reverb);
  //   reverb.toDestination();

  // * create dry/wet fader to resonated/reverb version
  const crossFade = new Tone.CrossFade();
  player.connect(crossFade.a);
  reverb.connect(crossFade.b);
  crossFade.fade.value = 0.8;
  crossFade.toDestination();

  // * expose parameters for above

  // * drive parameters based on mvmt
};

export const stopPlayer = () => {
  player.stop();
};
