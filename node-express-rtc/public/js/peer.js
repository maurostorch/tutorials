'use strict';
var Peer = function(config) {
    if (config) {
        this.config = config;
    } else {
        this.config = {
            iceServers: [{
                'url': 'stun:stun.l.google.com:19302'
            }],
            pcConstraint: null,
            dataConstraint: null
        };
    }
};
Peer.prototype = {
    connect: function() {
        if(!this.publishCandidates) {
            this.log('should specify publishCandidates(e) function.');
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
    },
    sendChannel: null,
    offer: function(callback) {
        var that = this;
        this.iam = 'offer';
        this.sendChannel = this.localConnection.createDataChannel('sendDataChannel',this.config.dataConstraint);
        this.sendChannel.onmessage = function(e){that.onMessage(e);};
        this.sendChannel.onopen = function(){that.onSendChannelStateChange();};
        this.sendChannel.onclose = function(){that.onSendChannelStateChange();};
        this.sendChannel.onerror = function(){that.onSendChannelStateChange();};
        var c = callback;
        var f = function(desc){
            that.localConnection.setLocalDescription(desc);
            c(desc);
        };
        this.localConnection.createOffer().then(f,function(err){this.log(e);});
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
        this.localConnection.setRemoteDescription(session);
        if(this.iam == 'awnser'){
            var c = callback;
            var that = this;
            var f = function(desc) {
                that.setLocalDescription(desc);
                c(desc);
            };
            var that = this;
            this.localConnection.createAnswer().then(f,function(err){that.log(err);});
        }
    },
    onSendChannelStateChange: function(){
        var readyState = this.sendChannel.readyState;
        this.log('Send channel state is: ' + readyState);
        this.event.notify(readyState,'sendChannel');
    },
    handleReceiveChannelStates: function(channel){
        var that = this;
        var f = function(){
            that.event.notify(channel.readyState,'recChannel');
        }
        channel.onopen = f;
        channel.onclose = f;
    },
    onMessage: function(e) {
        this.event.notify(e.data,'message');
    },
    onDataChannel: function(e){
        var that = this;
        this.sendChannel = e.channel;
        this.sendChannel.onmessage = function(e){that.onMessage(e);};
        this.sendChannel.onopen = function(){that.onSendChannelStateChange();};
        this.sendChannel.onclose = function(){that.onSendChannelStateChange();};
        this.sendChannel.onerror = function(){that.onSendChannelStateChange();};
        console.log("new data channel",this.sendChannel);
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
            console.log(session);
            this.localConnection.addIceCandidate(session);
        }
    },
    sendMessage: function(m) {
        if(m && m.trim().length > 0)
            this.sendChannel.send(m);
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
            console.log(this);
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
