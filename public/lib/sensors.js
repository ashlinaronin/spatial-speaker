import { getClientId } from "./getClientId.js";
import { socket } from "./sync-socket.js";

// collect all the elements we'll need to refer to
const frontToBackEl = document.querySelector("#frontToBack");
const leftToRightEl = document.querySelector("#leftToRight");
const rotateDegreesEl = document.querySelector("#rotateDegrees");
const xEl = document.querySelector("#x");
const yEl = document.querySelector("#y");
const zEl = document.querySelector("#z");
const statusEl = document.querySelector("#status");
const mapLinkEl = document.querySelector("#map-link");

// const motionListeners = [];

const latestMovement = {};

const sendLatestMovement = () => {
  socket.emit("movement", latestMovement);
};

export const getLatestMovement = () => latestMovement;

const getUtcTimestamp = () => new Date().getTime();

// adopted from https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API#examples
export function geoFindMe() {
  if (mapLinkEl) {
    mapLinkEl.href = "";
    mapLinkEl.textContent = "";
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    statusEl.textContent = "";

    if (mapLinkEl) {
      mapLinkEl.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
      mapLinkEl.textContent = `Latitude: ${latitude}°, Longitude: ${longitude}°`;
    }

    latestMovement.latitude = latitude;
    latestMovement.longitude = longitude;

    latestMovement.timestamp = getUtcTimestamp();
  }

  function error(err) {
    statusEl.textContent = `geo error, code: ${err.code}, message: ${err.message}`;
  }

  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation is not supported by your browser";
  } else {
    statusEl.textContent = "Locating…";
    navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000,
    });
  }
}

export const handleOrientationEvent = (alpha, beta, gamma) => {
  const rotateDegrees = alpha; // alpha: rotation around z-axis
  const frontToBack = beta; // beta: front back motion
  const leftToRight = gamma; // gamma: left to right

  if (frontToBackEl && leftToRightEl && rotateDegreesEl) {
    frontToBackEl.textContent = `frontToBack: ${frontToBack}`;
    leftToRightEl.textContent = `leftToRight: ${leftToRight}`;
    rotateDegreesEl.textContent = `rotateDegrees: ${rotateDegrees}`;
  }

  latestMovement.orientationAlpha = alpha;
  latestMovement.orientationBeta = beta;
  latestMovement.orientationGamma = gamma;

  latestMovement.timestamp = getUtcTimestamp();
};

export const handleMotionEvent = (event) => {
  const x = event.acceleration.x;
  const y = event.acceleration.y;
  const z = event.acceleration.z;

  if (xEl && yEl && zEl) {
    xEl.textContent = `x: ${x}`;
    yEl.textContent = `y: ${y}`;
    zEl.textContent = `z: ${z}`;
  }

  latestMovement.motionX = x;
  latestMovement.motionY = y;
  latestMovement.motionZ = z;

  const timestamp = getUtcTimestamp();

  latestMovement.timestamp = timestamp;
  // motionListeners.forEach((listener) => {
  //   listener({ x, y, z });
  // });
};

export const setupDeviceOrientation = () => {
  // from https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event#examples
  window.addEventListener(
    "deviceorientation",
    (event) => {
      handleOrientationEvent(event.alpha, event.beta, event.gamma);
    },
    true
  );
};

// todo: debounce?
// export const registerMotionListener = (callback) => {
//   if (typeof callback === "function") {
//     motionListeners.push(callback);
//   }
// };

export const setupDeviceMotion = () => {
  window.addEventListener("devicemotion", handleMotionEvent, true);
};

export const initializeSensorApis = async (clientId) => {
  latestMovement.clientId = clientId;

  // todo handle error case
  if ("DeviceMotionEvent" in window) {
    if (typeof DeviceMotionEvent.requestPermission !== "function") {
      // try to initialize without requesting permission
      setupDeviceMotion();
    } else {
      // ask nicely
      const permissionResponse = await DeviceMotionEvent?.requestPermission();
      if (permissionResponse === "granted") {
        setupDeviceMotion();
      }
    }
  }

  // if ("DeviceOrientationEvent" in window) {
  //   if (typeof DeviceOrientationEvent.requestPermission !== "function") {
  //     // try to initialize without requesting permission
  //     setupDeviceOrientation();
  //   } else {
  //     // ask nicely
  //     const permissionResponse =
  //       await DeviceOrientationEvent.requestPermission();
  //     if (permissionResponse === "granted") {
  //       setupDeviceOrientation();
  //     }
  //   }
  // }

  // geoFindMe();

  // start sending latest movement via socket to server
  // disable to see if this helps with memory use
  // const interval = setInterval(sendLatestMovement, 200);
};
