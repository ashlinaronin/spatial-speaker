let currentPhase = 0;

module.exports = {
  getPhase: () => currentPhase,
  setPhase: (newPhase) => {
    currentPhase = newPhase;
  },
};
