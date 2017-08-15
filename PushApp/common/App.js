import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { StackNavigator } from 'react-navigation';

import { LoginScreen } from './LoginScreen';
import { MessagingScreen } from './MessagingScreen';

import {NotificationsAndroid} from 'react-native-notifications';

const MyNavBar = StackNavigator({
                                 Login: { screen: LoginScreen },
                                 Messaging: { screen: MessagingScreen }
                                 });

class MyApp extends React.Component {

  constructor(props) {
      super(props)

      this.state = {}

      if (Platform.OS !== 'ios') {
          this.onAndroidPushRegistered = this.onAndroidPushRegistered.bind(this)
          NotificationsAndroid.setRegistrationTokenUpdateListener( this.onAndroidPushRegistered);
      }
  }

  render() {

    var {android_token} = this.state

    console.log('this.props in MyApp', this.props); // This will list the initialProps.

    // StackNavigator **only** accepts a screenProps prop so we're passing
    // initialProps.appstore through that.
    var screenProps = this.props
    if (android_token) {
        screenProps['android_token'] = android_token
    }
    return <MyNavBar screenProps={screenProps} />;
  }

  onAndroidPushRegistered(token) {
      console.log("Device Token Received", token);

      this.setState({android_token: token});
  }

}

AppRegistry.registerComponent('PushApp', () => MyApp);
