// this file is duplicated because i didn't want to spend time working on commonjs/es module interoperativity nightmare
// ok its a bit different here now
export const serverPhaseNameMap = {
  intro: {
    index: 0,
    playbackRate: 2.0,
    grainSize: 0.2,
    loop: false,
    duration: "16n",
    overlap: 0.1,
    reverse: true,
  },
  parameters: {
    index: 1,
    playbackRate: 2.0,
    grainSize: 0.2,
    loop: false,
    duration: "16n",
    overlap: 0.1,
    reverse: true,
  },
  drone: {
    index: 2,
    playbackRate: 0.001,
    grainSize: 0.001,
    loop: true,
    duration: "4m", // another option - no duration will default to full length of sample
    overlap: 2.5,
    reverse: true,
  },
  names: {
    index: 3,
    playbackRate: 1,
    grainSize: 0.2,
    loop: false,
    duration: "4n",
    overlap: 0.25,
    reverse: false,
  },
};

export const serverPhaseArray = Object.values(serverPhaseNameMap);
