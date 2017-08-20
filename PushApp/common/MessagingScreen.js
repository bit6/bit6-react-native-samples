import React from 'react';
import { View, TextInput, Button, Platform, Text } from 'react-native';
import { Push } from 'bit6';

import {NotificationsAndroid} from 'react-native-notifications';
import NotificationsIOS from 'react-native-notifications';

import { MySession } from './MySession';


export class MessagingScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: `Logged as ${navigation.state.params.accessToken.identity}/${navigation.state.params.accessToken.device}`,
    headerLeft:
      <Button title={'Logout'} onPress={() => {
          navigation.state.params.unregisterDevice()
          navigation.goBack()
          }}
      />
  });

  constructor(props,context) {
    super(props,context);

    this.pushSvc = new Push(this.props.navigation.state.params.accessToken)

    this.state = {
      destination : '',
      message : ''
    }

    if (Platform.OS === 'ios') {
      NotificationsIOS.requestPermissions();
      NotificationsIOS.consumeBackgroundQueue();
      NotificationsIOS.registerPushKit();
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ unregisterDevice: this.unregisterDevice.bind(this) });

    //already received push tokens
    if (this.props.screenProps.pushInfo) {
        this.registerDevice(this.props.screenProps.pushInfo)
    }
  }

  componentWillReceiveProps(nextProps) {
    //receiving push tokens for the first time
    if (this.props.screenProps.pushInfo !== nextProps.screenProps.pushInfo) {
        this.registerDevice(nextProps.screenProps.pushInfo)
    }
  }

  async registerDevice(pushInfo) {
    if (this.doingLogout) { return }
    var old_pushInfo = await MySession.getPushInfo()

    // Register push token
    if ( old_pushInfo !== pushInfo ) {
      this.pushSvc.register(pushInfo, function(err, d) {
          console.log('Got device ', d, err);
          if ( err.info ) {
            this.setState({bit6_error:JSON.parse(err.info).message})
          }
          else {
            MySession.setPushInfo(pushInfo)
          }
      }.bind(this));
    }
  }

  unregisterDevice(){
    this.doingLogout = true
    this.pushSvc.unregister()
    MySession.setPushInfo(null)
    MySession.setIdentity(null)
    this.props.screenProps.clearMessage()
  }

  render() {
    const { message, bit6_error } = this.state
    const { pushInfo, apns_token_error, lastMessage } = this.props.screenProps

    const service     = pushInfo ? pushInfo.service : 'fetching'
    const token       = pushInfo ? (pushInfo.token      || apns_token_error.localizedDescription) : 'fetching'
    const token_voip  = pushInfo ? (pushInfo.token_voip || 'doesn\'t apply') : 'fetching'

    return (
      <View style={{padding: 10}}>
          <TextInput style={{height: 40}} placeholder='Enter destination username' onChangeText={(destination) => this.setState({destination})} autoCapitalize='none'/>
          <TextInput style={{height: 40}} placeholder='Enter message' onChangeText={(message) => this.setState({message})} autoCapitalize='none' value={message}/>

          <View style={{ flex: 0, flexDirection: 'row' }}>
              <View style={{width: 150}}>
                  <Button onPress={() => this.sendMessage(null)} title='Send'/>
              </View>
              <View style={{width: 10}} />
              <View style={{width: 150}}>
                  <Button onPress={() => this.sendMessage('voip')} title='Send VoIP'/>
              </View>
          </View>

          <Text style={{paddingTop: 40, paddingBottom: 40}}>Incoming message: {lastMessage}</Text>

          <View>
              <Text style={{paddingBottom: 10}}>Service: {service}</Text>
              <Text style={{paddingBottom: 10}}>Token: {token}</Text>
              <Text style={{paddingBottom: 10}}>VoIP Token: {token_voip}</Text>
              <Text>{bit6_error ? bit6_error : ''}</Text>
          </View>
      </View>
    )
  }

  sendMessage(topic) {
    const { destination, message } = this.state;
    if ( destination !== '' && message !== '' ) {

      // FCM payload
      var fcm = {
        data: {
          title: 'RN-Demo',
          body: message
        }
      };
      // APNS payload
      var apns = {
        aps: {
          alert: message,
          sound: 'default',
          badge: 1
        }
      };

      // Topic only applies to APNS
      if (topic) {
        apns.topic = topic
        this.pushSvc.send( {to: destination, payload: {apns: apns}} );
      }
      else {
        this.pushSvc.send( {to: destination, payload: {fcm: fcm, apns: apns}} );
      }

      this.setState({message:'' })
    }
  }

}
