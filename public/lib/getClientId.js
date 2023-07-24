export function getClientId() {
  // grab clientId from query params
  const searchParams = new URLSearchParams(window.location.search);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    throw new Error("no clientId in search params");
  }
  return clientId;
}
