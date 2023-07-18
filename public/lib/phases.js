export const PHASES = {
  SELECT_TEAM: "SELECT_TEAM",
  RECORD_NAME: "RECORD_NAME",
  RECORD_CLICK: "RECORD_CLICK",
  UPLOAD: "UPLOAD",
};
const PHASES_ARRAY = Object.values(PHASES);
let phaseIndex = 0;

export function getPhase() {
  return PHASES_ARRAY[phaseIndex];
}

export function nextPhase() {
  if (phaseIndex === PHASES_ARRAY.length - 1) {
    throw new Error("phaseIndex out of bounds");
  }

  // hide anything from previous phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.add("hidden"));

  phaseIndex++;

  // show all things from next phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.remove("hidden"));

  // reset visualizer width (when it is hidden, it doesn't get width set properly)
  window.onresize();
}
