import React from 'react';
import { View, TextInput, Button, Platform, Text } from 'react-native';
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

    if (Platform.OS === 'ios') {
        NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered.bind(this));
      	NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed.bind(this));
      	NotificationsIOS.requestPermissions();
        NotificationsIOS.consumeBackgroundQueue();
    }
    else {
        NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken) => {
            this.setState({token:deviceToken, service:'fcm'})
            console.log('Push-notifications registered!', deviceToken)
        });
    }

    this.state = {
      device: '',
      identity : '',
      loging : false
    }
  }

  componentDidMount() {
    this._loadInitialState().done();
  }

  async _loadInitialState() {
      var device = await Bit6Session.getDevice()
      var identity = await Bit6Session.getIdentity()

      //has logged before
      if (device && identity) {
          this.setState ({device, identity, loging:true})
          this.generateJWT((jwt) => this.login(jwt))
      }
      //in this case we only got the device identifier
      else {
          this.setState ({device})
      }
  }

  render() {
    const { identity, error, service, token, loging } = this.state

    if ( error ) {
      return (
              <View style={{padding: 10}}>
              <Text>{error}</Text>
              </View>
              )
    }
    else if (service && token) {
      return (
              <View style={{padding: 10}}>
              <TextInput style={{height: 40}} placeholder='Enter your username' onChangeText={(identity) => this.setState({identity})} autoCapitalize='none' value={identity}/>
              <Button onPress={() => this.generateJWT((jwt) => this.login(jwt))} title='Login' disabled={loging}/>
              </View>
              )
    }
    else  {
      return (
              <View style={{padding: 10}}>
              <Text>Didnt load push token</Text>
              </View>
              )
    }
  }

  generateJWT(handler) {
    const { identity, device } = this.state

    if (identity !== '') {
      this.setState({loging:true})
      fetch('https://bit6-demo-token-svc.herokuapp.com/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                                 identity: identity,
                                 device: device,
                                 })
            })
      .then((response) => response.json())
      .then((responseJson) => {
            handler(responseJson.token);
            })
      .catch((error) => {
             console.error(error);
             this.setState({loging:false})
             });
    }
  }

  login(jwt) {
    const { service, token } = this.state

    var accessToken = new AccessToken(jwt);
    accessToken.on('expired', function(t) {
       console.log('AccessToken expired, need to renew', t);
       this.generateJWT((jwt) => accessToken.update(jwt))
    });

    // Register push token
    if (token && service) {
        var pushSvc = new Push(accessToken);
        pushSvc.register({service, token}, function(err, d) {
            console.log('Got device', d, err);
            if ( err.info ) {
                this.setState({error:JSON.parse(err.info).message})
            }
            else {
                const { navigate } = this.props.navigation;
                const { identity, device } = this.state;

                Bit6Session.login(identity)

                navigate('Messaging', { user: identity + '/' + device, pushSvc })
                this.setState({loging:false})
            }
        }.bind(this));
    }
  }

  onPushRegistered(token) {
      var service = this.props.screenProps.appstore ? 'apns' : 'apns-dev'
      this.setState({token, service})
      console.log("Device Token Received", token);
  }

  onPushRegistrationFailed(error) {
    console.error(error);
    this.setState({error:'Failed to generate push token'})
  }

  componentWillUnmount() {
    // prevent memory leaks!
    if (Platform.OS === 'ios') {
        NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered.bind(this));
        NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed.bind(this));
    }
  }

}
