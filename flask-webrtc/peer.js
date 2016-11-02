(function(){

    function notWebRTCCompatible(){
        throw new Error('Browser not compatible with WebRTC.');
    }

    window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection || notWebRTCCompatible;
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription || notWebRTCCompatible;
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || notWebRTCCompatible;

    document.querySelector('#callid').value = parseInt(Math.random()*100000000);
})();
var config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
var connection = {
	'optional':
		[{'DtlsSrtpKeyAgreement': false}, {'RtpDataChannels': true }]
};
var sdpConstraints = {'mandatory':
  {
    'OfferToReceiveAudio': false,
    'OfferToReceiveVideo': false
  }
};
var peerConnection;
var dataChannel;
function loadoffer() {
    peerConnection = new RTCPeerConnection(config, connection);
    peerConnection.onicecandidate = function(e){
        if (!peerConnection || !e || !e.candidate) return;
        sendNegotiation("candidate/offer", e.candidate);
    }
    dataChannel = peerConnection.createDataChannel("datachannel", {reliable: false});
    dataChannel.onmessage = function(e){console.log("DC message:" +e.data);};
    dataChannel.onmessage = function(e){
        var container = document.querySelector('.container');
        container.innerHTML = '<div class="message">'+e.data+'</div>'+container.innerHTML;
    };
    dataChannel.onopen = function(){console.log("------ DATACHANNEL OPENED ------");};
    dataChannel.onclose = function(){console.log("------- DC closed! -------")};
    dataChannel.onerror = function(){console.log("DC ERROR!!!")};
    var callid = document.querySelector('#callid').value;
    var source2 = new EventSource("/answer/"+callid);
    source2.onmessage = function(msg) {
        if (msg.data.trim() != 'FIRSTCALL')
            processAnswer(msg.data);
    };
    var source = new EventSource("/candidate/answer/"+callid);
    source.onmessage = function(msg) {
        if (msg.data.trim() != 'FIRSTCALL')
            processIce(msg.data);
    };
    peerConnection.createOffer(function (sdp) {
    	peerConnection.setLocalDescription(sdp);
    	sendNegotiation("offer", sdp);
    	console.log("------ SEND OFFER ------");
    }, function(a,b){console.log(a);console.log(b);}, sdpConstraints);
	peerConnection.ondatachannel = function () {
    	console.log('peerConnection.ondatachannel event fired.');
	};
};
function processIce(iceCandidate){
  peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(iceCandidate)));
};
function processAnswer(answer){
  peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
  console.log("------ PROCESSED ANSWER ------");
};
function loadanswer() {
    var callid = document.querySelector('#callid').value;
    if (callid.trim() == '') {
        console.log('inform a user to call');
        return;
    }
    peerConnection = new RTCPeerConnection(config, connection);
    peerConnection.onicecandidate = function(e){
        if (!peerConnection || !e || !e.candidate) return;
        sendNegotiation("candidate/answer", e.candidate);
    }
    dataChannel = peerConnection.createDataChannel("datachannel", {reliable: false});
    dataChannel.onmessage = function(e){console.log("DC message:" +e.data);};
    dataChannel.onmessage = function(e){
        var container = document.querySelector('.container');
        container.innerHTML = '<div class="message">'+e.data+'</div>'+container.innerHTML;
    };
    dataChannel.onopen = function(){console.log("------ DATACHANNEL OPENED ------");};
    dataChannel.onclose = function(){console.log("------- DC closed! -------")};
    dataChannel.onerror = function(){console.log("DC ERROR!!!")};
    peerConnection.ondatachannel = function () {
        console.log('peerConnection.ondatachannel event fired.');
	};
    var source = new EventSource("/candidate/offer/"+callid);
    source.onmessage = function(msg) {
        if (msg.data.trim() != 'FIRSTCALL')
            processIce(msg.data);
    }
    var http = new XMLHttpRequest();
    http.open("GET", '/offer/'+callid, true);
    http.onreadystatechange = function() {//Call a function when the state changes.
        //console.log(http.status);
        //console.log(http.responseText);
        if (http.status == 200){
            var resp=JSON.parse(http.responseText);
            // for (var i = 0; i < resp.candidates.length; i++) {
            //     processIce(resp.candidates[i]);
            // }
            peerConnection.setRemoteDescription(new RTCSessionDescription(resp));
            peerConnection.createAnswer(function (sdp) {
              peerConnection.setLocalDescription(sdp);
              sendNegotiation("answer", sdp);
              console.log("------ SEND ANSWER ------");
          	}, function(a,b){console.log(a);console.log(b);}, sdpConstraints);
        }
    };
    http.send();
}
function sendNegotiation(type,candidate) {
    //var container = document.querySelector('.container');
    //container.innerHTML = "<div><h1>"+type+"</h1><p>"+JSON.stringify(candidate)+"</p></div>" + container.innerHTML;
    var http = new XMLHttpRequest();
    var callid = document.querySelector('#callid').value;
    var url = '/'+type+'/'+callid;
    var params = JSON.stringify({type:candidate});
    http.open("POST", url, true);
    http.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    http.onreadystatechange = function() {//Call a function when the state changes.
        //console.log(http.status);
        //console.log(http.responseText);
    }
    http.send(params);
};
document.querySelector("#offerBtn").onclick = loadoffer;
document.querySelector("#answerBtn").onclick = loadanswer;
// document.querySelector("#candidateBtn").onclick = function() {
//     var t = document.querySelector("textarea").value;
//     document.querySelector("textarea").value='';
//     processIce(t);
// };
// document.querySelector("#procAnswerBtn").onclick = function() {
//     var t = document.querySelector("textarea").value;
//     document.querySelector("textarea").value='';
//     processAnswer(t);
// }
