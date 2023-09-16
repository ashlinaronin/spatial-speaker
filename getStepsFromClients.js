const getStepsFromClients = (connectedClients, numSteps, numTeams) => {
  const steps = Array(numSteps)
    .fill(null)
    .map((val, index) => ({ teamId: index % numTeams, clients: [] }));

  // don't want to mutate original array!
  const deepClonedClients = JSON.parse(JSON.stringify(connectedClients));

  // sort clients by joinedTimestamp and teamId so we can pull the latest one for each team when needed
  const sortedClients = deepClonedClients
    .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
    .sort((a, b) => a.teamId - b.teamId);

  while (sortedClients.length > 0) {
    for (let i = 0; i < numSteps; i++) {
      // don't waste time in for loop if we don't have any clients left to distribute over the steps
      if (sortedClients.length === 0) break;

      const step = steps[i];
      // try to find the oldest client that remains in the source array
      const oldestClientForTeamIndex = sortedClients.findIndex(
        ({ teamId }) => teamId === step.teamId
      );

      if (oldestClientForTeamIndex !== -1) {
        // if there still is a client for this team in the source array, remove it and add it to the clients array for this step
        const oldestClient = sortedClients[oldestClientForTeamIndex];

        sortedClients.splice(oldestClientForTeamIndex, 1);
        step.clients.push(oldestClient);
      }
    }
  }

  return steps;
};

module.exports = getStepsFromClients;
