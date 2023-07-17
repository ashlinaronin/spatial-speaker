// set up basic variables for app

const recordButton = document.querySelector(".record");
const soundClips = document.querySelector(".sound-clips");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");

let recording = false;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

const clientId = self.crypto.randomUUID();

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
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
      const uploadButton = document.createElement("button");
      const deleteButton = document.createElement("button");

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      uploadButton.textContent = "Upload";
      uploadButton.className = "upload";
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete";
      clipLabel.textContent = clipName;

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(uploadButton);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      uploadButton.onclick = async function (e) {
        // todo: url config for deployment

        const formData = new FormData();

        const selectedTeamId = document.querySelector(
          "input[name=team]:checked"
        ).value;

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

      deleteButton.onclick = function (e) {
        e.target.closest(".clip").remove();
      };
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("getUserMedia not supported on your browser!");
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  draw();

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    let sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();
