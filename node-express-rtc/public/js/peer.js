'use strict';
var Peer = function(config) {
    if (config) {
        this.config = config;
    } else {
        this.config = {
            iceServers: [
                { 'url': 'stun:stun.schlund.de'},
		        { 'url': 'stun:stun3.l.google.com:19302'},
                { 'url': 'stun:stun.l.google.com:19302'}
            ],
            pcConstraint: null,
            dataConstraint: null
        };
    }
};
Peer.prototype = {
    connect: function() {
        if(!this.publishCandidates) {
            this.event.notify('should specify publishCandidates(e) function.','log');
            return;
        }
        //this.localConnection = new RTCPeerConnection(this.config.iceServers, this.config.pcConstraint);
        if(typeof(RTCPeerConnection) !== 'undefined')
            this.localConnection = new RTCPeerConnection(this.config.iceServers);
        else if (typeof(webkitRTCPeerConnection) !== 'undefined')
            this.localConnection = new webkitRTCPeerConnection(this.config);
        var that = this;
        this.localConnection.onicecandidate = function(e){that.publishCandidates(e.candidate)};
        this.localConnection.ondatachannel = function(e){that.onDataChannel(e);};
        this.localConnection.onnegotiationneeded = function() {
            console.log('negotiation needed');
        }
        this.localConnection.onconnectionstatechange = function(event) {
            console.log(that.localConnection.connectionState);
        }
        this.localConnection.onsignalingstatechange = function(e) {
            console.log(that.localConnection.signalingState)
        }
    },
    channelList: [],
    getChannel: function(channelName) {
        var l=this.channelList.length, found = false;
        for(var i=0;i<l;i++) {
            if (this.channelList[i].label == channelName) {
                return this.channelList[i];
            }
        }
        return null;
    },
    removeChannel: function(channelName) {
        var l=this.channelList.length, found = false;
        for(var i=0;i<l;i++) {
            if (this.channelList[i].label == channelName) {
                found=true;
            }
            if(found && i+1 < l) {
                this.channelList[i] = this.channelList[i+1];
            }
        }
        if(found) {
            this.channelList.pop();
        }
    },
    addChannel: function(channel) {
        var l=this.channelList.length, found = false;
        for(var i=0;i<l;i++) {
            if (this.channelList[i].label == channel.label) {
                found=true;
                this.channelList[i] = channel;
                break;
            }
        }
        if(!found) {
            this.channelList.push(channel);
        }
    },
    offer: function(callback) {
        var that = this;
        this.iam = 'offer';
        this.createChannel('sendDataChannel');
        this.createChannel('sendFileChannel');
        this.getChannel('sendFileChannel').binaryType='arraybuffer';
        var c = callback;
        var f = function(desc){
            that.localConnection.setLocalDescription(desc);

            c(desc);
        };
        this.localConnection.createOffer().then(f,function(err){that.event.notify(err,'log');});
    },
    createChannel: function(channelName) {
        var that = this;
        var channel = this.localConnection.createDataChannel(channelName,this.config.dataConstraint);
        channel.onmessage = function(e){that.onMessage(e,channelName);};
        channel.onopen = this.onSendChannelStateChange;
        channel.onclose = this.onSendChannelStateChange;
        channel.onerror = this.onSendChannelStateChange;
        this.addChannel(channel);
    },
    setLocalDescription: function(desc){
        var session = new RTCSessionDescription();
        if( !(desc instanceof RTCSessionDescription)) {
            session.type = desc.type;
            session.sdp = desc.sdp;
        } else {
            session = desc;
        }
        this.localConnection.setLocalDescription(session);
    },
    setRemoteDescription: function(desc, callback){
        if(!this.iam) this.iam = 'awnser';
        var session = new RTCSessionDescription();
        if( !(desc instanceof RTCSessionDescription)) {
            session.type = desc.type;
            session.sdp = desc.sdp;
        } else {
            session = desc;
        }
        var l =this.channelList.length;
        console.log(this.channelList);
        var that = this;
        this.channelList.forEach(function(c){
            if(c.readyState != 'connecting') {
                that.createChannel(c.label);
            }
        });
        this.localConnection.setRemoteDescription(session);
        if(this.iam == 'awnser'){
            var c = callback;
            var that = this;
            var f = function(desc) {
                that.setLocalDescription(desc);
                c(desc);
            };
            var that = this;
            this.localConnection.createAnswer().then(f,function(err){that.event.notifyy(err,'log');});
        }
    },
    onSendChannelStateChange: function(){
        var readyState = this.readyState;
        console.log(this.label+' state is: ' + readyState);
    },
    recBuffer: [],
    expectedFileSize: -1,
    expectedFileName: '',
    onMessage: function(e,type) {
        if(type=='sendFileChannel') {
            this.recBuffer.push(e.data);
            var l = this.recBuffer.length, c=0;
            for(var i=0;i<l;i++) {
                c +=this.recBuffer[i].byteLength;
            }
            this.event.notify(c + ' expected size is '+this.expectedFileSize,'log');
            if (c==this.expectedFileSize) {
                var received = new window.Blob(this.recBuffer);
                this.recBuffer = [];
                this.expectedFileSize = -1;
                var r = {filename:this.expectedFileName,url:URL.createObjectURL(received)};
                this.event.notify(r,type);
            }
        } else {
            if (type=='sendDataChannel' && e.data.indexOf('filesize')>0) {
                var data = JSON.parse(e.data);
                this.expectedFileSize = data.filesize;
                this.expectedFileName = data.filename;
            } else {
                this.event.notify(e.data,type);
            }
        }
    },
    onDataChannel: function(e){
        var that = this;
        var c = e.channel;
        this.addChannel(c);
        c.onmessage = function(e){that.onMessage(e,c.label);};
        c.onopen = this.onSendChannelStateChange;
        c.onclose = this.onSendChannelStateChange;
        c.onerror = this.onSendChannelStateChange;
        if (c.label=='sendFileChannel')
            c.binaryType='arraybuffer';
        this.event.notify("new data channel"+JSON.stringify(c),'log');
    },
    publishCandidates: null,
    receiveCandidates: function(e){
        if (e){
            var session = new RTCIceCandidate();
            if(!(e instanceof RTCIceCandidate)){
                session.candidate = e.candidate;
                session.sdpMid = e.sdpMid;
                session.sdpMLineIndex = e.sdpMLineIndex;
            } else {
                session = e;
            }
            this.event.notify(session,'log');
            this.localConnection.addIceCandidate(session, function(e){console.log(e);}, function(e){console.log(e);});
        }
    },
    sendMessage: function(m) {
        if(m && m.trim().length > 0) {
            if(this.getChannel('sendDataChannel')==null || this.getChannel('sendDataChannel').readyState != 'open') {
                //this.channelList['sendDataChannel']=null;
                this.createChannel('sendDataChannel');
            }
            this.getChannel('sendDataChannel').send(m);
        }
    },
    sendFile: function(file) {
        if(file==null || file.name == null) return;
        if(this.getChannel('sendFileChannel')==null || this.getChannel('sendFileChannel').readyState != 'open') {
            //this.getChannel['sendFileChannel']=null;
            this.createChannel('sendFileChannel');
        }
        this.getChannel('sendDataChannel').send(JSON.stringify({filesize:file.size, filename:file.name}));
        var that = this;
        var chunkSize = 16384;
        var sliceFile = function(offset) {
            var reader = new window.FileReader();
            reader.onload = (function() {
                return function(e) {
                    that.getChannel('sendFileChannel').send(e.target.result);
                    if (file.size > offset + e.target.result.byteLength) {
                        window.setTimeout(sliceFile, 0, offset + chunkSize);
                    }
                    //sendProgress.value = offset + e.target.result.byteLength;
                };
            })(file);
            var slice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };
        sliceFile(0);
    },
    event: {
        listeners: {},
        addListener: function(e,t){
            if(!t) t='default';
            if (this.listeners[t]==null) this.listeners[t]=[];
            return this.listeners[t].push(e) - 1;
        },
        removeListener: function(e,t) {
            if(!t) t='default';
            if (this.listeners[t]==null) this.listeners[t]=[];
            if(isNaN(e)) this.listeners[t].splice(e,1);
            else {
                var l=this.listeners[t].length;
                for(var i=0;i<l;i++) {
                    if(this.listeners[t][i] == e){
                        this.listeners[t].splice(i,1);
                        break;
                    }
                }
            }
        },
        notify: function(o,t) {
            if(!t) t='default';
            if (this.listeners[t]==null) this.listeners[t]=[];
            var l = this.listeners[t].length;
            for(var i=0;i<l;i++) {
                this.listeners[t][i](o);
            }
        }
    },
    log: function(e) {
        console.log(e);
    }
}
