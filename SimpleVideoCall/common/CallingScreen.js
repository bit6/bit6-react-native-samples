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
    this.handleVideoElemChange = this.handleVideoElemChange.bind(this)
    this.leaveSession = this.leaveSession.bind(this)

    this.signalSvc.on('message', function(msg) {
       // See the code in 'inviteButton' click handler about
       // this signal message payload
       var t = msg.type;
       // Sender will contain a full addressof the other
       // user's client connection: identity/device/route
       var sender = msg.from;
       var ident = sender.split('/')[0];
       if (t === 'invite') {
         var sessionId = msg.data;
         console.log('Invite from', ident, 'to join a Session id=', sessionId);
         // Automatically accepting - by joining the session
         // If we want to reject the invite, we could send another signal
         // back to the invitor
         this.videoSvc.join(sessionId, function(err, s) {
           // Publish all my media into the Session
           //s.me.publish({audio: true, video: true});
         });
       }
    }.bind(this));

    // Init Video Service
    this.videoSvc = new Video(this.signalSvc);
    this.videoSvc.on('session', this.onSession);

    // Local video feed element available
    this.videoSvc.capture.on('video', function(v, op) {
      console.log('Local video elem', op, v);
      this.handleVideoElemChange(v, null, null, op);
    }.bind(this));

    this.state = {
      to: '',
      session : null,
      remoteStream: null,
      localStream: null,
      participant:null
    }
  }

  render() {
    const { to, session, remoteStream, localStream } = this.state
    if (session === null) {
    return (
            <View style={{padding: 10}}>
              <TextInput style={{height: 40}} placeholder='Destination' onChangeText={(to) => this.setState({to})} autoCapitalize='none' value={to}/>
              <Button onPress={() => this.invite()} title='Call'/>
            </View>
            )
    }
    else {
      return (
              <View style={{padding: 10}}>
                  <Text>Session Id: {session.id}</Text>
                  <Button onPress={() => this.leaveSession()} title='Leave'/>

                  <View style={styles.publish}>
                  { localStream !== null ? <RTCView streamURL={localStream} style={styles.selfView}/> : <View></View> }
                  <Button onPress={() => this.switchCamera()} title='Switch Camera'/>
                  </View>

                  <View style={styles.subscribe}>
                  <Text>Participant</Text>
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

  invite() {
    const { to } = this.state;
    if ( to !== '' ) {
      console.log('Invite clicked', to);
      this.videoSvc.create({mode: 'p2p'}, function(err, s) {
        console.log('Created session', s.id);
        // Let's send its ID to the recipient so he/she can join
        // We invent our own signaling format.

        this.signalSvc.send({to: to, type: 'invite', data: s.id});
      }.bind(this));
    }
  }

  switchCamera() {
    let pc = this.state.participant.rtc.pc
    let videotrack = pc.getLocalStreams()[0].getVideoTracks()[0]
    videotrack._switchCamera()
  }

  onSession(session, op) {
      console.log('Video Session', op, session);
      // New Video Session added
      if ( op > 0 ) {
        this.setState({session})

        // Listen to the changes in the Participants in this Session
        session.on('participant', function(p, op) {
             // New remote Participant joined
             if (op > 0) {
               this.setState({participant:p})
               // Subscribe to all media published by this remote Participant
               p.subscribe({ audio: true, video: true });
             }
             // Participant has left
             else if (op < 0) {
               this.setState({participant:null})
               // If this was the last remote Participant, let's leave the session too
               // since we are simulating a person to person calling
               session.leave()
             }
        }.bind(this));

        // Handle Video elements from this session
        session.on('video', function(v, p, op) {
          this.handleVideoElemChange(v, session, p, op);
        }.bind(this));

        // Publish local audio + video into the Session
        session.me.publish({ audio: true, video: true });
      }
      // Video Session removed
      else if ( op < 0 ) {
        this.setState({session:null,remoteStream:null,localStream:null,participant:null,destination:''})
      }
  }

  leaveSession() {
    this.state.session.leave()
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
