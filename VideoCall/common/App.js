import { AppRegistry } from 'react-native';
import { StackNavigator } from 'react-navigation';

import { LoginScreen } from './LoginScreen';
import { CallingScreen } from './CallingScreen';

const MyNavBar = StackNavigator({
                                Login: { screen: LoginScreen },
                                Calling: { screen: CallingScreen }
                                });

AppRegistry.registerComponent('VideoCall', () => MyNavBar);




// PATCH FOR WEBRTC

import { Platform } from 'react-native';
import { RTCPeerConnection, RTCMediaStream, RTCIceCandidate, RTCSessionDescription, RTCView, MediaStreamTrack } from 'react-native-webrtc';
import { getUserMedia as reactGetUserMedia } from 'react-native-webrtc';

global.RTCPeerConnection = RTCPeerConnection
global.RTCMediaStream = RTCMediaStream
global.RTCIceCandidate = RTCIceCandidate
global.RTCSessionDescription = RTCSessionDescription
global.RTCView = RTCView
global.MediaStreamTrack = MediaStreamTrack

// Expose navigator.getUserMedia() and patch it

global.navigator = {
getUserMedia: function(opts, successCb, errorCb) {
    //console.log('n.getUserMedia()', opts)
    // Clone constraints
    let opts2 = Object.assign({}, opts);
    // For some reason RN WebRTC does not like video = true
    // Replace it with more specific constraints if it is 'true'
    if (opts2.video === true) {
        opts2.video = {
        mandatory: { minWidth: 640, minHeight: 360 },
        facingMode: 'user' // or 'environment'
        }
    }
    reactGetUserMedia(opts2, successCb, errorCb);
}
};


// Patch RTCPeerConnection to support pc.getLocalStreams()

const pc_addStream = RTCPeerConnection.prototype.addStream;

RTCPeerConnection.prototype.addStream = function (s) {
    if (!this._localStreams) {
        this._localStreams = []
    }
    let idx = this._localStreams.indexOf(s);
    if (idx < 0) {
        this._localStreams.push(s);
        pc_addStream.call(this, s);
    }
};

const pc_removeStream = RTCPeerConnection.prototype.removeStream;

RTCPeerConnection.prototype.removeStream = function (s) {
    if (!this._localStreams) {
        this._localStreams = []
    }
    let idx = this._localStreams.indexOf(s);
    if (idx >= 0) {
        this._localStreams.splice(idx, 1);
        pc_removeStream.call(this, s);
    }
};

RTCPeerConnection.prototype.getLocalStreams = function () {
    if (!this._localStreams) {
        this._localStreams = []
    }
    return this._localStreams;
};

// Patch RTCPeerConnection to release local streams on close

const pc_close = RTCPeerConnection.prototype.close;

RTCPeerConnection.prototype.close = function () {
  if (!this._localStreams) {
      this._localStreams = []
  }

  if (this._localStreams.length > 0) {
    this._localStreams.forEach((s) => {
      this.removeStream(s)

      //taken from https://github.com/oney/react-native-webrtc/issues/209#issuecomment-281482869
      s.getTracks().forEach((t) => {
        s.removeTrack(t);
      });
      s.release();

    });

    pc_close.call(this);
  }
};
