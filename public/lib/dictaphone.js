// set up basic variables for app
import { visualize } from "./visualizer.js";

const recordButton = document.querySelector(".record");
const nextButton = document.querySelector(".next");
const soundClips = document.querySelector(".sound-clips");
let currentClipName = "";
let recordings = [];

let recording = false;
const clientId = self.crypto.randomUUID();

const constraints = { audio: true };
let chunks = [];

const onGumSuccess = function (stream) {
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

    const clipName = `${clientId}_name`;
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

    recordings.push({ name: clipName, blob });

    chunks = [];
    const audioURL = window.URL.createObjectURL(blob);

    audio.src = audioURL;
    console.log("recorder stopped");
  };

  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };

  nextButton.onclick = async function (e) {
    // todo: url config for deployment

    const formData = new FormData();

    const selectedTeamId = document.querySelector(
      "input[name=team]:checked"
    ).value;

    const { clipName, blob } = recordings[0];

    formData.append("teamId", selectedTeamId);
    formData.append("file", blob, `${clipName}.ogg`);

    const response = await fetch(
      `http://localhost:3333/recording/${clientId}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const jsonResponse = response.json();

    console.log("recording post response", jsonResponse);
  };
};

const onGumError = function (err) {
  console.log("The following error occured: " + err);
};

if (!navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia not supported in your browser");
} else {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(onGumSuccess, onGumError);
}
