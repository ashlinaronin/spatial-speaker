import { visualize } from "./visualizer.js";
import { PHASES, getPhase, nextPhase } from "./phases.js";

const recordButton = document.querySelector(".record");
const nextButton = document.querySelector(".next");
const soundClips = document.querySelector(".sound-clips");

let recordings = [];
let recording = false;
const clientId = self.crypto.randomUUID();

const registerUser = async function () {
  const selectedTeamId = document.querySelector(
    "input[name=team]:checked"
  ).value;

  // todo: url config for deployment
  await fetch(`http://localhost:3333/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, teamId: Number(selectedTeamId) }),
  });
};

const onGumSuccess = function (stream) {
  let chunks = [];
  const mediaRecorder = new MediaRecorder(stream);

  visualize(stream);

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

  mediaRecorder.onstop = function (e) {
    console.log("data available after MediaRecorder.stop() called.");

    const clipName = `${clientId}_${getPhase()}`;
    const clipContainer = document.createElement("article");
    const clipLabel = document.createElement("p");
    const audio = document.createElement("audio");

    clipContainer.classList.add("clip");
    audio.setAttribute("controls", "");
    clipLabel.textContent = clipName;

    clipContainer.appendChild(audio);
    clipContainer.appendChild(clipLabel);
    soundClips.appendChild(clipContainer);

    audio.controls = true;
    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });

    recordings.push({ clipName, blob });

    chunks = [];
    const audioURL = window.URL.createObjectURL(blob);

    audio.src = audioURL;
    console.log("recorder stopped");
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
        await fetch(`http://localhost:3333/recording/${clientId}`, {
          method: "POST",
          body: formData,
        });
      })
    );
  };

  nextButton.onclick = async function () {
    nextPhase();

    if (getPhase() === PHASES.RECORD_NAME) {
      await registerUser();
    }

    if (getPhase() === PHASES.UPLOAD) {
      await uploadRecordings();
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
