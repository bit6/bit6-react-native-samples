import React from 'react';
import { AppState, View, TextInput, Button, Platform, Text } from 'react-native';
import { AccessToken, Push } from 'bit6';

import {NotificationsAndroid} from 'react-native-notifications';
import NotificationsIOS from 'react-native-notifications';

import { Bit6Session } from './Bit6Session';

export class LoginScreen extends React.Component {
    static navigationOptions = {
        title: 'Bit6',
    };

  constructor(props,context) {
    super(props,context);

    this.state = {
      processing : true,
      apns_token_error : false,
      appState: AppState.currentState
    }

    this.registerForPushNotifications()
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    // prevent memory leaks!
    if (Platform.OS === 'ios') {
        NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.oniOSPushRegistered.bind(this));
        NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.oniOSPushRegistrationFailed.bind(this));
        NotificationsIOS.removeEventListener('pushKitRegistered', this.oniOSPushKitRegistered.bind(this));

        //on iOS we listen to events in AppState to be able to clear the notification badge when returning to the app
        AppState.removeEventListener('change', this._handleAppStateChange);
    }
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        NotificationsIOS.setBadgesCount(0);
    }
    this.setState({appState: nextAppState});
  }

  registerForPushNotifications() {
      if (Platform.OS === 'ios') {
          NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.oniOSPushRegistered.bind(this));
          NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.oniOSPushRegistrationFailed.bind(this));
          NotificationsIOS.requestPermissions();

          NotificationsIOS.addEventListener('pushKitRegistered', this.oniOSPushKitRegistered.bind(this));
          NotificationsIOS.registerPushKit();

          NotificationsIOS.consumeBackgroundQueue();
      }
      else {
          NotificationsAndroid.setRegistrationTokenUpdateListener( this.onAndroidPushRegistered.bind(this));
      }
  }

  async _loadInitialState() {
      var device = await Bit6Session.getDevice()
      var old_identity = await Bit6Session.getIdentity()
      var identity = old_identity
      var old_service = await Bit6Session.getService()
      var old_token = await Bit6Session.getToken()
      var old_token_voip = await Bit6Session.getTokenVoIP()

      this.setState({device, identity, old_identity, old_service, old_token, old_token_voip})
      this.automaticLogin()
  }

  //this is called after getting the push tokens
  automaticLogin(){
      const { device, identity, old_identity, token, token_voip, apns_token_error } = this.state

      //has logged before
      if (device && old_identity) {
          //on iOS we wait for both: token (or an error) and token_voip (which always succeed)
          if (Platform.OS === 'ios') {
              if ( (token || apns_token_error) && token_voip) {
                  this.generateJWT((jwt) => this.login(jwt))
              }
          }
          else {
            this.generateJWT((jwt) => this.login(jwt))
          }
      }
      else {
          this.setState({processing:false})
      }
  }

  render() {
    const { identity, bit6_error, service, token, token_voip, processing } = this.state

    if ( bit6_error ) {
      return (
              <View style={{padding: 10}}>
              <Text>{bit6_error}</Text>
              </View>
              )
    }
    //on Android we wait for service and token. on iOS we also wait for token_voip
    else if (service && token && (Platform.OS === 'ios' ? token_voip : true)  ) {
      return (
              <View style={{padding: 10}}>
              <TextInput style={{height: 40}} placeholder='Enter your username' onChangeText={(identity) => this.setState({identity})} autoCapitalize='none' value={identity}/>
              <Button onPress={() => {this.generateJWT((jwt) => this.login(jwt))}   } title='Login' disabled={processing}/>
              </View>
              )
    }
    else  {
      return (
              <View style={{padding: 10}}>
              <Text>Fetching tokens</Text>
              </View>
              )
    }
  }

  generateJWT(handler) {
    const { identity, device } = this.state

    this.setState({processing:true});

    if (identity !== '') {
      fetch('https://bit6-demo-token-svc.herokuapp.com/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({identity,device})
            })
      .then((response) => response.json())
      .then((responseJson) => {
            handler(responseJson.token);
            })
      .catch((error) => {
             console.error(error);
             this.setState({processing:false})
             });
    }
  }

  login(jwt) {
    const { old_service, old_token, old_token_voip } = this.state
    const { service, token, token_voip } = this.state

    var accessToken = new AccessToken(jwt);
    accessToken.on('expired', function(t) {
       console.log('AccessToken expired, need to renew', t);
       this.generateJWT((jwt) => accessToken.update(jwt))
    });



    var pushSvc = new Push(accessToken);
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
        var params = token_voip ? {service, token, token_voip} : {service, token}
        pushSvc.register(params, function(err, d) {
            console.log('Got device ', d, err);
            if ( err.info ) {
                this.setState({bit6_error:JSON.parse(err.info).message})
            }
            else {
                this.completeLogin(pushSvc)
            }
        }.bind(this));
    }
    else {
        this.completeLogin(pushSvc)
    }
  }

  completeLogin(pushSvc) {
      const { navigate } = this.props.navigation;
      const { identity, device, service, token, token_voip } = this.state;

      //we forget the old state
      this.setState({old_identity: null, old_service: null, old_token: null, old_token_voip: null})
      Bit6Session.login(identity, service, token, token_voip)

      navigate('Messaging', { user: identity + '/' + device, pushSvc })
      this.setState({processing:false})
  }

  // iOS Handlers

  oniOSPushRegistered(token) {
    var service = this.props.screenProps.appstore ? 'apns' : 'apns-dev'
    this.setState({service, token})
    console.log("Device Token Received", token);

    //if we have the voip token too we load the initial state
    if ( this.state.token_voip ) {
        this._loadInitialState().done();
    }
  }

  oniOSPushRegistrationFailed(error) {
    this.setState({apns_token_error:true})
    console.log("Device Token Error", error);

    //if we have the voip token too we load the initial state
    if ( this.state.token_voip ) {
        this._loadInitialState().done();
    }
  }

  oniOSPushKitRegistered(token_voip) {
    var service = this.props.screenProps.appstore ? 'apns' : 'apns-dev'
    this.setState({service, token_voip})
	console.log("PushKit Token Received: " + token_voip);

    //if we have the regular token too we load the initial state
    if ( this.state.token || this.state.apns_token_error ) {
        this._loadInitialState().done();
    }
  }

  // Android Handlers

  onAndroidPushRegistered(token) {
    var service = 'fcm'
    this.setState({service, token})
    console.log("Device Token Received", token);

    this._loadInitialState().done();
  }

}
