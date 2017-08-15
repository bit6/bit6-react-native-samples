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

    this.state = {
      destination : '',
      message : '',
      lastMessage : '---',
      apns_token_error : false,
      pushSvc : new Push(this.props.navigation.state.params.accessToken)
    }

    if (Platform.OS === 'ios') {
        this.oniOSNotificationReceivedForeground = this.oniOSNotificationReceivedForeground.bind(this)
        this.oniOSNotificationReceivedBackground = this.oniOSNotificationReceivedBackground.bind(this)
        this.oniOSNotificationOpened = this.oniOSNotificationOpened.bind(this)
        this.oniOSPushRegistered = this.oniOSPushRegistered.bind(this)
        this.oniOSPushRegistrationFailed = this.oniOSPushRegistrationFailed.bind(this)
        this.oniOSPushKitRegistered = this.oniOSPushKitRegistered.bind(this)

        NotificationsIOS.addEventListener('notificationReceivedForeground', this.oniOSNotificationReceivedForeground);
        NotificationsIOS.addEventListener('notificationReceivedBackground', this.oniOSNotificationReceivedBackground);
        NotificationsIOS.addEventListener('notificationOpened', this.oniOSNotificationOpened);

        NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.oniOSPushRegistered);
        NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.oniOSPushRegistrationFailed);
        NotificationsIOS.addEventListener('pushKitRegistered', this.oniOSPushKitRegistered);

        NotificationsIOS.requestPermissions();
        NotificationsIOS.consumeBackgroundQueue();

        NotificationsIOS.registerPushKit();
    }
    else {
        this.onAndroidNotificationOpened = this.onAndroidNotificationOpened.bind(this)
        this.onAndroidNotificationReceived = this.onAndroidNotificationReceived.bind(this)

        NotificationsAndroid.setNotificationOpenedListener(this.onAndroidNotificationOpened);
        NotificationsAndroid.setNotificationReceivedListener(this.onAndroidNotificationReceived);
    }
  }

  componentDidMount() {
      this.props.navigation.setParams({ unregisterDevice: this.unregisterDevice.bind(this) });

      if (Platform.OS !== 'ios') {
          this.onAndroidPushRegistered(this.props.screenProps.android_token)
      }
  }

  componentWillUnmount() {
      // prevent memory leaks!
      if (Platform.OS === 'ios') {
          NotificationsIOS.removeEventListener('notificationReceivedForeground', this.oniOSNotificationReceivedForeground);
          NotificationsIOS.removeEventListener('notificationReceivedBackground', this.oniOSNotificationReceivedBackground);
          NotificationsIOS.removeEventListener('notificationOpened', this.oniOSNotificationOpened);

          NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.oniOSPushRegistered);
          NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.oniOSPushRegistrationFailed);
          NotificationsIOS.removeEventListener('pushKitRegistered', this.oniOSPushKitRegistered);
      }
  }

  async registerDevice() {
    var old_service = await MySession.getService()
    var old_token = await MySession.getToken()
    var old_token_voip = await MySession.getTokenVoIP()

    const { service, token, token_voip } = this.state

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
        this.state.pushSvc.register(params, function(err, d) {
            ('Got device ', d, err);
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
      this.state.pushSvc.unregister()
      MySession.setTokens(null, null, null)
      MySession.setIdentity(null)
  }

  render() {
    const { lastMessage, message, token, token_voip, bit6_error } = this.state;
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
                        <Button onPress={() => this.sendMessage('voip')} title='Send Voip'/>
                    </View>
                </View>

                <Text style={{paddingTop: 40, paddingBottom: 40}}>Incoming message: {lastMessage}</Text>

                <View>
                    <Text style={{paddingBottom: 10}}>Token: {token ? token : 'fetching'}</Text>
                    <Text style={{paddingBottom: 10}}>VoIP Token: {token_voip ? token_voip : 'fetching'}</Text>
                    <Text>{bit6_error ? bit6_error : ''}</Text>
                </View>
            </View>
            )
  }

  sendMessage(topic) {
    const { destination, message } = this.state;
    if ( destination !== '' && message !== '' ) {
      const { pushSvc } = this.state;

      // FCM payload
      var fcm = {
        data: {
          title: "RN-Demo",
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

      //topic only applies to APNS
      if (topic) {
          apns['topic'] = topic
          pushSvc.send( {to: destination, payload: {apns: apns}} );
      }
      else {
        pushSvc.send( {to: destination, payload: {fcm: fcm, apns: apns}} );
      }

      this.setState({message:'' })
    }
  }

  // Notifications Handlers

  oniOSPushRegistered(token) {
    console.log("Device Token Received", token);

    var service = this.props.screenProps.apnsSandbox ? 'apns-dev' : 'apns'
    this.setState({service, token})

    //if we have the voip token too we load the initial state
    if ( this.state.token_voip ) {
        this.registerDevice()
    }
  }

  oniOSPushRegistrationFailed(error) {
    console.log("Device Token Error", error);
    this.setState({apns_token_error:true})
  }

  oniOSPushKitRegistered(token_voip) {
    var service = this.props.screenProps.apnsSandbox ? 'apns-dev' : 'apns'
    this.setState({service, token_voip})

    //if we finished fetching the regular token too we load the initial state
    if ( this.state.token || this.state.apns_token_error ) {
        this.registerDevice()
    }
  }

  oniOSNotificationReceivedForeground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  oniOSNotificationReceivedBackground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  oniOSNotificationOpened(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  onAndroidPushRegistered(token) {
      console.log("Device Token Received", token);

      this.setState({service: 'fcm', token, token_voip:'doesn\'t apply'});
      this.registerDevice()
  }

  onAndroidNotificationOpened(notification) {
      this.setState({lastMessage:notification.getMessage()})
  }

  onAndroidNotificationReceived(notification) {
      this.setState({lastMessage:notification.getMessage()})
  }

}
