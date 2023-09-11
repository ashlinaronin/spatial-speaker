export const PHASES = {
  RECORD_NAME: { friendlyName: "name", value: "RECORD_NAME" },
  SEQUENCER: { friendlyName: "sequencer", value: "SEQUENCER" },
  GOODBYE: { friendlyName: "goodbye", value: "GOODBYE" },
};
const PHASES_ARRAY = Object.values(PHASES);
let phaseIndex = 0;

export function getPhase() {
  return PHASES_ARRAY[phaseIndex];
}

export function getPhaseFriendlyName() {
  return PHASES_ARRAY[phaseIndex]?.friendlyName;
}

export function setLocalPhase(newPhaseIndex) {
  // if (phaseIndex === PHASES_ARRAY.length - 1) {
  //   throw new Error("phaseIndex out of bounds");
  // }

  // hide anything from current phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.add("hidden"));

  phaseIndex = newPhaseIndex;

  // show all things from next phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.remove("hidden"));

  // reset visualizer width (when it is hidden, it doesn't get width set properly)
  window.dispatchEvent(new Event("resize"));
}

export function nextPhase() {
  if (phaseIndex === PHASES_ARRAY.length - 1) {
    throw new Error("phaseIndex out of bounds");
  }

  // hide anything from current phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.add("hidden"));

  phaseIndex++;

  // show all things from next phase
  document
    .querySelectorAll(`.phase-${phaseIndex}`)
    .forEach((el) => el.classList.remove("hidden"));

  // reset visualizer width (when it is hidden, it doesn't get width set properly)
  window.dispatchEvent(new Event("resize"));
}
