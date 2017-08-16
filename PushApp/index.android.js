import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { StackNavigator } from 'react-navigation';

import {NotificationsAndroid} from 'react-native-notifications';

import { LoginScreen } from './common/LoginScreen';
import { MessagingScreen } from './common/MessagingScreen';


const MyNavBar = StackNavigator({
  Login: { screen: LoginScreen },
  Messaging: { screen: MessagingScreen }
});


class MyApp extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      service: 'fcm'
    }

    NotificationsAndroid.setRegistrationTokenUpdateListener( this.onPushRegistered.bind(this) );
    NotificationsAndroid.setNotificationOpenedListener( this.onNotificationOpened.bind(this) );
    NotificationsAndroid.setNotificationReceivedListener( this.onNotificationReceived.bind(this) );
  }

  render() {
    console.log('this.props in MyApp', this.props); // This will list the initialProps.

    const { service, token, lastMessage } = this.state

    var screenProps = {}
    if (service && token) {
      screenProps['service'] = service
      screenProps['token'] = token
    }
    if (lastMessage) {
      screenProps['lastMessage'] = lastMessage
    }
    return <MyNavBar screenProps={screenProps} />;
  }

  onPushRegistered(token) {
    console.log("Device Token Received", token);
    this.setState({token})
  }

  onNotificationOpened(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  onNotificationReceived(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

}

AppRegistry.registerComponent('PushApp', () => MyApp);
