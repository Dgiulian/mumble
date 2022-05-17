import './libs/AgoraRTC_N-4.11.0';

const APP_ID = import.meta.env.VITE_APP_ID;

/* Getting the user id from the session storage. 
If it is not there, it is generating a random number
and storing it in the session storage. */
let uid = sessionStorage.getItem('uid');
if (!uid) {
  uid = Math.floor(Math.random() * 1000000);
  sessionStorage.setItem('uid', uid);
}
// In test mode we don't need a token
let token = null;
let client;
let queryString = window.location.search;
let roomId = new URLSearchParams(queryString).get('roomId') ?? 'main';

/* If the roomId is not set, it redirects to the lobby. */
if (!roomId) {
  window.location = '/lobby.html';
}
let localTracks = [];
let remoteUsers = {};


async function joinRoomInit() {
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(APP_ID, roomId, token, uid);
  client.on('user-published', handleUserPublished);
  client.on('user-left', handleUserLeft);

  await joinStream();
}
async function joinStream() {
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
    encoderConfig: {
      width: {
        min: 640, ideal: 1920, max: 1920
      },
      height: {
        min: 480, ideal: 1080, max: 1080
      }
    }
  });
  let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div>
               </>`;
  document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
  document.getElementById('user-container-' + uid).addEventListener('click', expandVideoFrame);

  localTracks[1].play(`user-${uid}`)  // play the video stream in the video player
  await client.publish([localTracks[0], localTracks[1]]);
}
async function handleUserPublished(user, mediaType) {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);
  const currentPlayer = document.getElementById(`user-${user.uid}`);
  if (!currentPlayer) {
    const player = `<div class="video__container" id="user-container-${user.uid}">
    <div class="video-player" id="user-${user.uid}"></div>
    </>`;
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById('user-container-' + user.uid).addEventListener('click', expandVideoFrame);
  }

  if (displayFrame.style.display) {
    player.style.height = '100px'
    player.style.width = '100px'

  }

  if (mediaType === 'video') {
    user.videoTrack.play(`user-${user.uid}`)  // play the video stream in the video player    
  }
  if (mediaType === 'audio') {
    user.audioTrack.play()
  }
}

async function handleUserLeft(user) {
  delete remoteUsers[user.uid];
  const item = document.getElementById(`user-container-${user.uid}`)
  if (item) {
    item.remove();
  }
  if (userIdInDisplayFrame === `user-container-${user.uid}`) {
    displayFrame.style.display = null;
    let videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '300px';
    }
  }
}

joinRoomInit();

