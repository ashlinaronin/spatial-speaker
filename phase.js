let currentPhase = 0;

let phaseChangeListeners = [];

module.exports = {
  getPhase: () => currentPhase,
  setPhase: (newPhase) => {
    currentPhase = newPhase;
    phaseChangeListeners.forEach((listener) => {
      listener(newPhase);
    });
  },
  registerPhaseChangeListener: (callback) => {
    if (typeof callback === "function") {
      phaseChangeListeners.push(callback);
    }
  },
};
