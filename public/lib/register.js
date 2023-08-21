import { visualize } from "./visualizer.js";
import { PHASES, getPhase, getPhaseFriendlyName, nextPhase } from "./phases.js";

const recordButton = document.querySelector(".record");
const soundClips = document.querySelector(".sound-clips");
const resonatorPageLink = document.querySelector(".resonator-page-link");

let recordings = [];
let recording = false;
const clientId = self.crypto.randomUUID();
resonatorPageLink.href = `resonator.html?clientId=${clientId}`;

const registerUser = async function () {
  // todo: url config for deployment
  await fetch(`register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });
};

const onGumSuccess = function (stream) {
  let chunks = [];
  const mediaRecorder = new MediaRecorder(stream);

  visualize(stream);

  mediaRecorder.onstop = function () {
    console.log("recorder stopped");

    const clipName = `${clientId}_${getPhase().value}`;
    const clipContainer = document.createElement("article");
    clipContainer.id = `audio_${clipName}`; // id must start with letter and guid may or may not... so this is a safe way to ensure it always starts with a letter

    soundClips.appendChild(clipContainer);

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

        // todo: url config for deployment
        await fetch(`recording/${clientId}`, {
          method: "POST",
          body: formData,
        });
      })
    );
  };

  const transitionToNextPhase = async () => {
    nextPhase();

    if (getPhase().value === PHASES.UPLOAD.value) {
      await registerUser();
      await uploadRecordings();
    }
  };

  recordButton.onclick = function () {
    if (recording) {
      recording = false;
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      recordButton.style.background = "";
      recordButton.style.color = "";
      recordButton.textContent = "record";
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
