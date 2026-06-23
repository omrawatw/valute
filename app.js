const cameraVideo = document.getElementById("video");

const MASTER_PASSWORD = "280411";
let unlockedapp = false;
async function startCamera() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });

        video.srcObject = stream;

    }
    catch (err) {

        console.error(err);
        alert("Camera permission denied");

    }

}

startCamera();

function unlockWithPassword() {

    const pass =
        document.getElementById("masterPassword").value;

    if (pass === MASTER_PASSWORD) {

        openDashboard();

    } else {

        alert("Wrong Password");

    }

}

function openDashboard() {

    if (unlocked)
        return;

    unlocked = true;

    document.querySelector(".container")
        .style.display = "none";

    document.getElementById("dashboard")
        .style.display = "block";

    speak("Welcome Om. Access Granted.");

}

function logout() {

    location.reload();

}

function speak(text) {

    const speech =
        new SpeechSynthesisUtterance(text);

    speechSynthesis.speak(speech);

}

setInterval(() => {

    const clock =
        document.getElementById("clock");

    if (clock) {

        clock.innerText =
            new Date().toLocaleTimeString();

    }

}, 1000);