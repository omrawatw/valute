const video = document.getElementById("video");
const statusBox = document.getElementById("status");
const matchStatus = document.getElementById("matchStatus");

let modelsLoaded = false;
let unlocked = false;

// =====================
// SPEAK
// =====================

function speak(text){

    const speech =
    new SpeechSynthesisUtterance(text);

    speech.rate = 1;
    speech.pitch = 1;

    speechSynthesis.speak(speech);

}

// =====================
// STATUS
// =====================

function setStatus(text){

    if(statusBox){

        statusBox.innerText = text;

    }

    console.log(text);

}

// =====================
// CAMERA
// =====================

async function startCamera(){

    try{

        const stream =
        await navigator.mediaDevices.getUserMedia({
            video:true
        });

        video.srcObject =
        stream;

        setStatus(
            "Camera Online"
        );

    }
    catch(err){

        console.error(err);

        setStatus(
            "Camera Access Denied"
        );

    }

}

// =====================
// LOAD MODELS
// =====================

async function loadModels(){

    try{

        setStatus(
            "Loading Models..."
        );

        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");

        await faceapi.nets.faceLandmark68Net.loadFromUri("./models");

        await faceapi.nets.faceRecognitionNet.loadFromUri("./models");

        modelsLoaded = true;

        setStatus(
            "AI Ready"
        );

        speak(
            "Face recognition ready SIR"
        );

    }
    catch(err){

        console.error(err);

        setStatus(
            "Model Load Failed"
        );

    }

}

// =====================
// REGISTER FACE
// =====================

async function registerFace(){

    if(!modelsLoaded){

        alert(
            "Models Not Loaded"
        );

        return;

    }

    const detection =
    await faceapi
    .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

    if(!detection){

        alert(
            "No Face Detected"
        );

        return;

    }

    const descriptor =
    Array.from(
        detection.descriptor
    );

    try{

        const response =
        await fetch(
            "https://valute-hsd4.onrender.com/face/register",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    descriptor
                })
            }
        );

        const result =
        await response.json();

        if(result.success){

            speak(
                "Face Registered SIR"
            );

            alert(
                "Face Registered Successfully"
            );

        }

    }
    catch(err){

        console.error(err);

    }

}

// =====================
// DELETE FACE
// =====================

async function deleteFace(){

    try{

        const response =
        await fetch(
            "https://valute-hsd4.onrender.com/face",
            {
                method:"DELETE"
            }
        );

        const result =
        await response.json();

        if(result.success){

            alert(
                "Face Deleted"
            );

        }

    }
    catch(err){

        console.error(err);

    }

}

// =====================
// VERIFY FACE
// =====================

async function verifyFace(){

    if(!modelsLoaded) return;

    if(unlocked) return;

    try{

        const savedResponse =
        await fetch(
            "https://valute-hsd4.onrender.com/face"
        );

        const savedData =
        await savedResponse.json();

        if(!savedData.success){

            return;

        }

        const detection =
        await faceapi
        .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

        if(!detection){

            setStatus(
                "No Face"
            );

            return;

        }

        const currentDescriptor =
        detection.descriptor;

        const savedDescriptor =
        new Float32Array(
            JSON.parse(
                savedData.face_descriptor
            )
        );

        const distance =
        faceapi.euclideanDistance(
            currentDescriptor,
            savedDescriptor
        );

        const match =
        Math.max(
            0,
            (1 - distance) * 100
        );

        if(matchStatus){

            matchStatus.innerText =
            "Match : " +
            match.toFixed(1) +
            "%";

        }

        if(match >= 75){

            unlocked = true;

            setStatus(
                "ACCESS GRANTED"
            );

            speak(
                "Welcome Back SIR "
            );

            const container =
            document.querySelector(
                ".container"
            );

            const dashboard =
            document.getElementById(
                "dashboard"
            );

            if(container){

                container.style.display =
                "none";

            }

            if(dashboard){

                dashboard.style.display =
                "block";

            }

        }

    }
    catch(err){

        console.error(err);

    }

}

// =====================
// PASSWORD LOGIN
// =====================

function unlockWithPassword(){

    const password =
    document.getElementById(
        "masterPassword"
    ).value;

    if(password === "ironman123"){

        speak(
            "Access Granted"
        );

        document.querySelector(
            ".container"
        ).style.display =
        "none";

        document.getElementById(
            "dashboard"
        ).style.display =
        "block";

    }
    else{

        speak(
            "Access Denied, I DON'T KNOW YOU GET OUT OF MY SIR'S LAPTOP"
        );

        alert(
            "Wrong Password"
        );

    }

}

// =====================
// LOGOUT
// =====================

function logout(){

    location.reload();

}

// =====================
// START
// =====================

window.onload = async()=>{

    await startCamera();

    await loadModels();

    setInterval(
        verifyFace,
        1000
    );

};
