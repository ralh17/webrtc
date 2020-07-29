let divSelectRoom         = document.getElementById('selectRoom')
let divConsultingRoom   = document.getElementById('consultingRoom')
let inputRoomNuber      = document.getElementById('roomNumber')
let btnGoRoom           = document.getElementById('goRoom')
let localVideo          = document.getElementById('localVideo')
let remoteVideo         = document.getElementById('remoteVideo')

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller

const iceServer = {
    "iceServer": [
        {"urls": "stun:stun.services.mozilla.com"},
        {"urls": "stun:stun.l.google.com:19302"}
    ]
}

const streamConstraints = {
    audio: true,
    video: true
}

const socket = io()

btnGoRoom.onclick = () => {
    if(inputRoomNuber.value === ''){
        alert('Nombre de la sala vacio')
    }else{
        roomNumber = inputRoomNuber.value
        socket.emit('create or join', roomNumber)
        divSelectRoom.style = "display: none"
        divConsultingRoom.style = "display: block"
    }
}

socket.on('created', room =>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                localStream = stream
                localVideo.srcObject = stream
                isCaller = true
            })
            .catch(error => {
                console.log('Ocurrio un error', error)
            })
})

socket.on('joined', room =>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
            .then(stream => {
                localStream = stream
                localVideo.srcObject = stream
                socket.emit('ready', roomNumber)
            })
            .catch(error => {
                console.log('Ocurrio un error', error)
            })
})

socket.on('ready', () =>{
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServer)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.createOffer()
            .then(sessionDescription =>{
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(error =>{
                console.log('Error ready socket', error)
            })
    }
})

socket.on('offer', (event) =>{
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServer)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer()
            .then(sessionDescription =>{
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                })
            })
            .catch(error =>{
                console.log('Error ready socket', error)
            })
    }
})

socket.on('answer', event =>{
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate', event =>{
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    })
    rtcPeerConnection.addIceCandidate(candidate)
})

function onAddStream(event) {  
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0]
}

function onIceCandidate(event){
    if(event.candidate){
        socket.emit('candidate',{
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
    

}