export const PHASES = {
  SELECT_TEAM: { friendlyName: "team", value: "SELECT_TEAM" },
  RECORD_NAME: { friendlyName: "name", value: "RECORD_NAME" },
  UPLOAD: { friendlyName: "upload", value: "UPLOAD" },
};
const PHASES_ARRAY = Object.values(PHASES);
const phaseEl = document.querySelector(".phase");
let phaseIndex = 0;

export function getPhase() {
  return PHASES_ARRAY[phaseIndex];
}

export function getPhaseFriendlyName() {
  return PHASES_ARRAY[phaseIndex]?.friendlyName;
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

  phaseEl.textContent = `${phaseIndex}/${PHASES_ARRAY.length - 1}`;
}
