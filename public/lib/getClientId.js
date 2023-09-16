export function getClientId() {
  // grab clientId from query params
  const searchParams = new URLSearchParams(window.location.search);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    throw new Error("no clientId in search params");
  }
  return clientId;
}

export function getTeamId() {
  // grab teamId from query params
  const searchParams = new URLSearchParams(window.location.search);
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    throw new Error("no teamId in search params");
  }
  return Number(teamId);
}
