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
      message : '',
      lastMessage : '---',
      apns_token_error : false
    }

    if (Platform.OS === 'ios') {
      NotificationsIOS.requestPermissions();
      NotificationsIOS.consumeBackgroundQueue();
      NotificationsIOS.registerPushKit();
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ unregisterDevice: this.unregisterDevice.bind(this) });
  }

  componentWillReceiveProps(nextProps) {
    const { service, token, token_voip } = nextProps.screenProps

    //receiving push tokens for the first time
    if (this.props.screenProps.service !== service) {
        this.registerDevice(service, token, token_voip)
    }
  }

  async registerDevice(service, token, token_voip) {
    var old_service = await MySession.getService()
    var old_token = await MySession.getToken()
    var old_token_voip = await MySession.getTokenVoIP()

    var postDevice = false
    if (Platform.OS === 'ios') {
        if (old_service !== service || old_token !== token || old_token_voip !== token_voip) {
          postDevice = true
        }
    }
    else {
      if (old_service !== service || old_token !== token) {
        postDevice = true
      }
    }

    // Register push token
    if (postDevice) {
      var params = Platform.OS === 'ios' ? {service, token, token_voip} : {service, token}
      this.pushSvc.register(params, function(err, d) {
          console.log('Got device ', d, err);
          if ( err.info ) {
            this.setState({bit6_error:JSON.parse(err.info).message})
          }
          else {
            MySession.setTokens(service, token, token_voip)
          }
      }.bind(this));
    }
  }

  unregisterDevice(){
    this.pushSvc.unregister()
    MySession.setTokens(null, null, null)
    MySession.setIdentity(null)
  }

  render() {
    const { message, bit6_error } = this.state
    const { service, token, token_voip, lastMessage } = this.props.screenProps
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
              <Text style={{paddingBottom: 10}}>Service: {service ? service : 'fetching'}</Text>
              <Text style={{paddingBottom: 10}}>Token: {token ? token : 'fetching'}</Text>
              <Text style={{paddingBottom: 10}}>{token_voip ? 'VoIP Token: '+token_voip : ''}</Text>
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
