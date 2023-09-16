const assert = require("node:assert/strict");
const getStepsFromClients = require("./getStepsFromClients");

const connectedClients = [
  {
    clientId: "9a3a9e37-4400-4078-adc3-c5e6498f1914",
    teamId: 2,
    joinedTimestamp: 990,
  },
  {
    clientId: "39674357-ee42-418e-b9f5-56d18c1e0a61",
    teamId: 1,
    joinedTimestamp: 100,
  },
  {
    clientId: "876af287-4882-43c4-b2c9-074cb4a14a0f",
    teamId: 3,
    joinedTimestamp: 1300,
  },
  {
    clientId: "e11eab1b-de9f-46b1-a335-4f07ee2c0aca",
    teamId: 0,
    joinedTimestamp: 8800,
  },
  {
    clientId: "0036542a-b0c2-4b76-b53b-31a3e88a18b0",
    teamId: 0,
    joinedTimestamp: 3200,
  },
  {
    clientId: "fa2877a2-ee38-4742-98ef-11e3b56d2fc4",
    teamId: 1,
    joinedTimestamp: 2200,
  },
  {
    clientId: "70b130a7-ed5e-4832-b31e-d7d4bbb4258e",
    teamId: 0,
    joinedTimestamp: 380,
  },
  {
    clientId: "da644cc6-325d-4ed6-ac03-3ef2cfc0412c",
    teamId: 3,
    joinedTimestamp: 420,
  },
  {
    clientId: "9bef22fb-8d26-4bc7-8d94-283e3064fca0",
    teamId: 0,
    joinedTimestamp: 150,
  },
  {
    clientId: "f18ab305-0fe5-4d59-bfbb-a7da269dcd94",
    teamId: 1,
    joinedTimestamp: 85,
  },
  {
    clientId: "0af9e38c-0938-4c09-b3cb-018360e6dcb9",
    teamId: 2,
    joinedTimestamp: 9500,
  },
  {
    clientId: "005f7d9d-9012-4964-b1ef-c4858254528f",
    teamId: 2,
    joinedTimestamp: 9000,
  },
  {
    clientId: "1c8106c1-bf7a-49d2-af68-94ce87c88d39",
    teamId: 1,
    joinedTimestamp: 3000,
  },
  {
    clientId: "0adda464-1c3f-4f04-8252-04ebb682d097",
    teamId: 3,
    joinedTimestamp: 190,
  },
  {
    clientId: "00794b4f-b481-47f2-ae6e-e480bf777284",
    teamId: 2,
    joinedTimestamp: 3500,
  },
  {
    clientId: "5d9068e0-dcf3-4f46-80c1-1e9f33ea0b1a",
    teamId: 1,
    joinedTimestamp: 180,
  },
  {
    clientId: "407c8884-9b39-40cf-bb81-bf49207e0b74",
    teamId: 3,
    joinedTimestamp: 120,
  },
  {
    clientId: "abe62ba0-e63a-405c-8135-117c5f6c3434",
    teamId: 2,
    joinedTimestamp: 750,
  },
  {
    clientId: "fdfb57df-1493-4d27-8c7f-ec1bc76abf08",
    teamId: 0,
    joinedTimestamp: 850,
  },
  {
    clientId: "7d65b22f-dff9-4eb0-96a2-22c17c991295",
    teamId: 3,
    joinedTimestamp: 600,
  },
  {
    clientId: "0e0ec447-722e-428b-a0bd-aa1ea7dfa26a",
    teamId: 0,
    joinedTimestamp: 450,
  },
  {
    clientId: "2f43f7a4-9c43-4188-91ae-5edbb84d060d",
    teamId: 0,
    joinedTimestamp: 25,
  },
  {
    clientId: "4d8d676d-e0f1-4403-a35f-a0ce66f51b07",
    teamId: 3,
    joinedTimestamp: 5000,
  },
  {
    clientId: "6ef16e93-e4b9-495a-bb25-e5fd5502b1bb",
    teamId: 1,
    joinedTimestamp: 4400,
  },
  {
    clientId: "2ab477b1-0fe4-4eb4-9eb5-d14d88573df7",
    teamId: 0,
    joinedTimestamp: 300,
  },
  {
    clientId: "5e0d7436-ef10-4dc2-b334-bd9e3f03e372",
    teamId: 3,
    joinedTimestamp: 2200,
  },
  {
    clientId: "a57d45cb-714d-4e96-b727-45d5a33fbd7f",
    teamId: 2,
    joinedTimestamp: 20,
  },
  {
    clientId: "a4887960-c12f-4543-b585-8770737a7870",
    teamId: 1,
    joinedTimestamp: 400,
  },
  {
    clientId: "f1e84881-17a4-4a8c-943a-65c1d34d569a",
    teamId: 2,
    joinedTimestamp: 700,
  },
  {
    clientId: "53a968e6-8687-4f92-9116-dfef9d787ef8",
    teamId: 2,
    joinedTimestamp: 7000,
  },
  {
    clientId: "f22c483a-cd36-47fa-b06d-585ffbc8ce7e",
    teamId: 1,
    joinedTimestamp: 800,
  },
  {
    clientId: "4f29eb4a-6d02-479b-a08a-cfb4bc676133",
    teamId: 3,
    joinedTimestamp: 100,
  },
  {
    clientId: "aaaaa-6d02-479b-a08a-cfb4bc676133",
    teamId: 0,
    joinedTimestamp: 2222,
  },
];

assert.deepStrictEqual(getStepsFromClients(connectedClients, 16, 4), [
  {
    teamId: 0,
    clients: [
      {
        clientId: "2f43f7a4-9c43-4188-91ae-5edbb84d060d",
        teamId: 0,
        joinedTimestamp: 25,
      },
      {
        clientId: "0e0ec447-722e-428b-a0bd-aa1ea7dfa26a",
        teamId: 0,
        joinedTimestamp: 450,
      },
      {
        clientId: "e11eab1b-de9f-46b1-a335-4f07ee2c0aca",
        teamId: 0,
        joinedTimestamp: 8800,
      },
    ],
  },
  {
    teamId: 1,
    clients: [
      {
        clientId: "f18ab305-0fe5-4d59-bfbb-a7da269dcd94",
        teamId: 1,
        joinedTimestamp: 85,
      },
      {
        clientId: "f22c483a-cd36-47fa-b06d-585ffbc8ce7e",
        teamId: 1,
        joinedTimestamp: 800,
      },
    ],
  },
  {
    teamId: 2,
    clients: [
      {
        clientId: "a57d45cb-714d-4e96-b727-45d5a33fbd7f",
        teamId: 2,
        joinedTimestamp: 20,
      },
      {
        clientId: "00794b4f-b481-47f2-ae6e-e480bf777284",
        teamId: 2,
        joinedTimestamp: 3500,
      },
    ],
  },
  {
    teamId: 3,
    clients: [
      {
        clientId: "4f29eb4a-6d02-479b-a08a-cfb4bc676133",
        teamId: 3,
        joinedTimestamp: 100,
      },
      {
        clientId: "7d65b22f-dff9-4eb0-96a2-22c17c991295",
        teamId: 3,
        joinedTimestamp: 600,
      },
    ],
  },
  {
    teamId: 0,
    clients: [
      {
        clientId: "9bef22fb-8d26-4bc7-8d94-283e3064fca0",
        teamId: 0,
        joinedTimestamp: 150,
      },
      {
        clientId: "fdfb57df-1493-4d27-8c7f-ec1bc76abf08",
        teamId: 0,
        joinedTimestamp: 850,
      },
    ],
  },
  {
    teamId: 1,
    clients: [
      {
        clientId: "39674357-ee42-418e-b9f5-56d18c1e0a61",
        teamId: 1,
        joinedTimestamp: 100,
      },
      {
        clientId: "fa2877a2-ee38-4742-98ef-11e3b56d2fc4",
        teamId: 1,
        joinedTimestamp: 2200,
      },
    ],
  },
  {
    teamId: 2,
    clients: [
      {
        clientId: "f1e84881-17a4-4a8c-943a-65c1d34d569a",
        teamId: 2,
        joinedTimestamp: 700,
      },
      {
        clientId: "53a968e6-8687-4f92-9116-dfef9d787ef8",
        teamId: 2,
        joinedTimestamp: 7000,
      },
    ],
  },
  {
    teamId: 3,
    clients: [
      {
        clientId: "407c8884-9b39-40cf-bb81-bf49207e0b74",
        teamId: 3,
        joinedTimestamp: 120,
      },
      {
        clientId: "876af287-4882-43c4-b2c9-074cb4a14a0f",
        teamId: 3,
        joinedTimestamp: 1300,
      },
    ],
  },
  {
    teamId: 0,
    clients: [
      {
        clientId: "2ab477b1-0fe4-4eb4-9eb5-d14d88573df7",
        teamId: 0,
        joinedTimestamp: 300,
      },
      {
        clientId: "aaaaa-6d02-479b-a08a-cfb4bc676133",
        teamId: 0,
        joinedTimestamp: 2222,
      },
    ],
  },
  {
    teamId: 1,
    clients: [
      {
        clientId: "5d9068e0-dcf3-4f46-80c1-1e9f33ea0b1a",
        teamId: 1,
        joinedTimestamp: 180,
      },
      {
        clientId: "1c8106c1-bf7a-49d2-af68-94ce87c88d39",
        teamId: 1,
        joinedTimestamp: 3000,
      },
    ],
  },
  {
    teamId: 2,
    clients: [
      {
        clientId: "abe62ba0-e63a-405c-8135-117c5f6c3434",
        teamId: 2,
        joinedTimestamp: 750,
      },
      {
        clientId: "005f7d9d-9012-4964-b1ef-c4858254528f",
        teamId: 2,
        joinedTimestamp: 9000,
      },
    ],
  },
  {
    teamId: 3,
    clients: [
      {
        clientId: "0adda464-1c3f-4f04-8252-04ebb682d097",
        teamId: 3,
        joinedTimestamp: 190,
      },
      {
        clientId: "5e0d7436-ef10-4dc2-b334-bd9e3f03e372",
        teamId: 3,
        joinedTimestamp: 2200,
      },
    ],
  },
  {
    teamId: 0,
    clients: [
      {
        clientId: "70b130a7-ed5e-4832-b31e-d7d4bbb4258e",
        teamId: 0,
        joinedTimestamp: 380,
      },
      {
        clientId: "0036542a-b0c2-4b76-b53b-31a3e88a18b0",
        teamId: 0,
        joinedTimestamp: 3200,
      },
    ],
  },
  {
    teamId: 1,
    clients: [
      {
        clientId: "a4887960-c12f-4543-b585-8770737a7870",
        teamId: 1,
        joinedTimestamp: 400,
      },
      {
        clientId: "6ef16e93-e4b9-495a-bb25-e5fd5502b1bb",
        teamId: 1,
        joinedTimestamp: 4400,
      },
    ],
  },
  {
    teamId: 2,
    clients: [
      {
        clientId: "9a3a9e37-4400-4078-adc3-c5e6498f1914",
        teamId: 2,
        joinedTimestamp: 990,
      },
      {
        clientId: "0af9e38c-0938-4c09-b3cb-018360e6dcb9",
        teamId: 2,
        joinedTimestamp: 9500,
      },
    ],
  },
  {
    teamId: 3,
    clients: [
      {
        clientId: "da644cc6-325d-4ed6-ac03-3ef2cfc0412c",
        teamId: 3,
        joinedTimestamp: 420,
      },
      {
        clientId: "4d8d676d-e0f1-4403-a35f-a0ce66f51b07",
        teamId: 3,
        joinedTimestamp: 5000,
      },
    ],
  },
]);
