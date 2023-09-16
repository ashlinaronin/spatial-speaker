import { visualize, stopVisualizing } from "./visualizer.js";
import { PHASES, getPhase, nextPhase } from "./phases.js";
import { setupSequencer } from "./sequencer.js";
import { initializeSocket } from "./sync-socket.js";
import { initializeSensorApis } from "./sensors.js";

// collect all the elements we'll need to refer to
const recordButton = document.querySelector(".record");
const clientIdEl = document.querySelector("#client-id");
const teamIdEl = document.querySelector("#team-id");

let recordings = [];
let recording = false;
const clientId = uuidv4();
let teamId;

const registerUser = async function () {
  const response = await fetch(`register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });
  const registeredUser = await response.json();
  teamId = registeredUser.teamId;
};

const sleep = async (ms) =>
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const loadSequencer = async () => {
  clientIdEl.textContent = `clientId: ${clientId}`;
  teamIdEl.textContent = `teamId: ${teamId}`;
  initializeSocket(clientId);

  await Tone.start();

  // wait for sync to init
  await sleep(5000);
  await setupSequencer();
};

const onGumSuccess = function (stream) {
  let chunks = [];
  const mediaRecorder = new MediaRecorder(stream);

  visualize(stream);

  mediaRecorder.onstop = function () {
    console.log("recorder stopped");

    const clipName = `${clientId}_${getPhase().value}`;
    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    const audioURL = window.URL.createObjectURL(blob);
    recordings.push({ clipName, blob });
    chunks = [];

    // after the recording has been made, transition to next phase
    // this allows us to allow the user to only use one button instead of making them click stop _and_ next
    transitionToNextPhase();
  };

  mediaRecorder.ondataavailable = function (event) {
    chunks.push(event.data);
  };

  const uploadRecordings = async function () {
    await Promise.all(
      recordings.map(async ({ blob, clipName }) => {
        const formData = new FormData();
        formData.append("file", blob, `${clipName}.ogg`);

        await fetch(`recording/${clientId}`, {
          method: "POST",
          body: formData,
        });
      })
    );
  };

  const transitionToNextPhase = async () => {
    nextPhase();

    if (getPhase().value === PHASES.SEQUENCER.value) {
      await registerUser();

      // update URL so that if user refreshes it will have the necessary context
      if (history.pushState) {
        history.pushState(
          null,
          "",
          `${window.location.origin}${window.location.pathname}sequencer.html?clientId=${clientId}&teamId=${teamId}`
        );
      }
      await sleep(200);
      await uploadRecordings();
      await sleep(200);
      await loadSequencer();
    }
  };

  recordButton.onclick = async function () {
    if (recording) {
      recording = false;
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      recordButton.style.background = "";
      recordButton.style.color = "";
      recordButton.textContent = "record";
      await initializeSensorApis(clientId);
      stopVisualizing();
    } else {
      recording = true;
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      recordButton.style.background = "red";
      recordButton.textContent = "stop";
    }
  };
};

const onGumError = function (err) {
  console.log("The following error occured: " + err);
};

if (!navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia not supported in your browser");
} else {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(onGumSuccess, onGumError);
}
