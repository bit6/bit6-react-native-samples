import React from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { Signal, Video } from 'bit6';

export class CallingScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
                                                  title: `Logged as ${navigation.state.params.accessToken.identity}/${navigation.state.params.accessToken.device}`,
                                                  });

  constructor(props,context) {
    super(props,context);

    this.signalSvc = new Signal(this.props.navigation.state.params.accessToken)

    this.onSession = this.onSession.bind(this)
    this.onParticipant = this.onParticipant.bind(this)
    this.handleVideoElemChange = this.handleVideoElemChange.bind(this)
    this.leaveSession = this.leaveSession.bind(this)

    this.signalSvc.on('message', function(msg) {
         console.log('Received direct signal', this);
    });

    // Init Video Service
    this.videoSvc = new Video(this.signalSvc);
    this.videoSvc.on('session', this.onSession);

    // Get notified about video elements for local video feed
    // v - video element to add or remove
    // op - operation. 1 - add, 0 - update, -1 - remove
    this.videoSvc.capture.on('video', function(v, op) {
      console.log('Local video elem', op, v);
      this.handleVideoElemChange(v, null, null, op);
    }.bind(this));

    this.state = {
      session : null,
      sessionId : '',
      remoteStream: null,
      localStream: null,
      participant: null,
      publishing: { audio: true, video: true },
      subscribedTo: { audio: true, video: true }
    }
  }

  render() {
    const { sessionId, session, remoteStream, localStream, participant, subscribedTo, publishing } = this.state
    if (session === null) {
    return (
            <View style={{padding: 10}}>
              <TextInput style={{height: 40}} placeholder='session-id' onChangeText={(sessionId) => this.setState({sessionId})} autoCapitalize='none' value={sessionId}/>
              <Button onPress={() => this.joinCall()} title='Join'/>
              <Button onPress={() => this.createCall()} title='Create'/>
            </View>
            )
    }
    else {
      return (
              <View style={{padding: 10}}>
                  <Text>Session Id: {sessionId}</Text>
                  <Button onPress={() => this.leaveSession()} title='LEAVE SESSION'/>

                  <View style={styles.publish}>
                  <Text>Me (Publishing)</Text>
                  <View style={styles.buttons}>
                    <Button onPress={() => this.updatePublish('audio', publishing['audio'])} title={`Audio (${publishing['audio']})`}/>
                    <Button onPress={() => this.updatePublish('video', publishing['video'])} title={`Video (${publishing['video']})`}/>
                  </View>
                  { localStream !== null ? <RTCView streamURL={localStream} style={styles.selfView}/> : <View></View> }
                  <Button onPress={() => this.switchCamera()} title='Switch Camera'/>
                  </View>

                  <View style={styles.subscribe}>
                  <Text>Participant (subscribed to)</Text>
                  { participant !== null ?
                      <View style={styles.buttons}>
                        <Button onPress={() => this.updateSubscribedTo(participant, 'audio', subscribedTo['audio'])} title={`Audio (${subscribedTo['audio']})`}/>
                        <Button onPress={() => this.updateSubscribedTo(participant, 'video', subscribedTo['video'])} title={`Video (${subscribedTo['video']})`}/>
                      </View>
                    : <View></View>
                  }
                  { remoteStream !== null ? <RTCView streamURL={remoteStream} style={styles.remoteView}/> : <View></View> }
                  </View>
              </View>
              )
    }
  }

  joinCall() {
    const { sessionId } = this.state;
    if ( sessionId !== '' ) {
      this.videoSvc.join(sessionId, function(err, s) {
        console.log('Session joined', err, s.id);
      });
    }
  }

  createCall() {
    this.videoSvc.create({mode: 'p2p'}, function(err, s) {
      console.log('Session created', err, s.id);
    });
  }

  switchCamera() {
    const localStream = this.videoSvc.capture.localStream
    if (localStream) {
        const videoTracks = localStream.getVideoTracks()
        if (videoTracks.length === 1) {
            videoTracks[0]._switchCamera()
        }
    }
  }

  onSession(s, op) {
      console.log('Video Session', op, s);
      if ( op > 0 ) {
        this.setState({sessionId:s.id, session:s})

        s.on('participant', this.onParticipant);

        // Get notified about new video elements for remote video feeds.
        // v - video element to add or remove
        // p - participant
        // op - operation. 1 - add, 0 - update, -1 - remove
        s.on('video', function(v, p, op) {
          this.handleVideoElemChange(v, s, p, op);
        }.bind(this));

        var media = { audio: true, video: true } ;
        s.me.publish(media);
      }
      else if ( op < 0 ) {
        this.setState({session:null,remoteStream:null,localStream:null,participant:null,publishing:{ audio: true, video: true },subscribedTo:{ audio: true, video: true }})
      }
  }

  leaveSession() {
    this.state.session.leave()
  }

  onParticipant(p, op) {
   console.log('Video Participant', op, p);
   if ( op > 0 ) {
     this.setState({participant:p})
     p.subscribe(this.state.subscribedTo);
   }
   else if ( op < 0 ) {
     this.setState({participant:null})
   }
  }

  updatePublish(kind, value) {
    var state = this.state.publishing
    state[kind] = !value
    var newMedia = {[kind]:state[kind]}
    this.state.session.me.publish(newMedia);
    this.setState({publishing:state})
  }

  updateSubscribedTo(p, kind, value) {
    var state = this.state.subscribedTo
    state[kind] = !value
    var newMedia = {[kind]:state[kind]}
    p.subscribe(newMedia);
    this.setState({subscribeTo:state})
  }

  // v.srcObject - stream to add or remove
  // s - Session that has this video or null if it is a local feed
  // p - Session Participant that has this video or null if it is a local feed
  // op - operation. 1 - add, 0 - update, -1 - remove
  handleVideoElemChange(v, s, p, op) {
    if ( op != 0 ) {
      if ( p ) {
        this.setState({ remoteStream: op > 0 ? v.srcObject.toURL() : null});
      }
      else {
        this.setState({ localStream: op > 0 ? v.srcObject.toURL() : null});
      }
    }
  }

}

const styles = StyleSheet.create({
                                 selfView: { width: 200, height: 150 },
                                 publish: { backgroundColor: 'rgba(164, 205, 255, 1.0)' },
                                 subscribe: { backgroundColor: 'rgba(255, 153, 102, 1.0)' },
                                 remoteView: { width: 200, height: 150, flexGrow: 1 },
                                 buttons: { flex: 0, flexDirection: 'row', height: 50 }
                                 });
