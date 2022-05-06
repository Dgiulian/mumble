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
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div>
               </>`;
  document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
  localTracks[1].play(`user-${uid}`)  // play the video stream in the video player
  await client.publish([localTracks[0],localTracks[1]]);
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
  }
  if(mediaType === 'video') {
    user.videoTrack.play(`user-${user.uid}`)  // play the video stream in the video player    
  }
  if(mediaType === 'audio'){
    user.audioTrack.play()
  }
}

async function handleUserLeft(user){
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
}

joinRoomInit();

