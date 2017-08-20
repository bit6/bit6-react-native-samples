import React from 'react';
import { AppRegistry, Platform, AppState } from 'react-native';
import { StackNavigator } from 'react-navigation';

import NotificationsIOS from 'react-native-notifications';

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
      service: (this.props.apnsSandbox ? 'apns-dev' : 'apns'),
      lastMessage: '',
      appState: AppState.currentState
    }

    this.onNotificationReceivedForeground = this.onNotificationReceivedForeground.bind(this)
    this.onNotificationReceivedBackground = this.onNotificationReceivedBackground.bind(this)
    this.onNotificationOpened = this.onNotificationOpened.bind(this)
    this.onPushRegistered = this.onPushRegistered.bind(this)
    this.onPushRegistrationFailed = this.onPushRegistrationFailed.bind(this)
    this.onPushKitRegistered = this.onPushKitRegistered.bind(this)

    NotificationsIOS.addEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground);
    NotificationsIOS.addEventListener('notificationReceivedBackground', this.onNotificationReceivedBackground);
    NotificationsIOS.addEventListener('notificationOpened', this.onNotificationOpened);

    NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered);
    NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed);
    NotificationsIOS.addEventListener('pushKitRegistered', this.onPushKitRegistered);
  }

  componentDidMount() {
    //we listen to events in AppState to be able to clear the notification badge when returning to the app
    AppState.addEventListener('change', this._handleAppStateChange);

    NotificationsIOS.setBadgesCount(0);
  }

  componentWillUnmount() {
    // prevent memory leaks!
    NotificationsIOS.removeEventListener('notificationReceivedForeground', this.onNotificationReceivedForeground);
    NotificationsIOS.removeEventListener('notificationReceivedBackground', this.onNotificationReceivedBackground);
    NotificationsIOS.removeEventListener('notificationOpened', this.onNotificationOpened);

    NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered);
    NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed);
    NotificationsIOS.removeEventListener('pushKitRegistered', this.onPushKitRegistered);

    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  render() {
    console.log('this.props in MyApp', this.props); // This will list the initialProps.

    const { service, token, token_voip, apns_token_error, lastMessage } = this.state

    var screenProps = {clearMessage:this.clearMessage.bind(this)}
    if (token_voip) {
      if (token) {
        screenProps['pushInfo'] = {service, token, token_voip}
      }
      else if (apns_token_error) {
        screenProps['pushInfo'] = {service, token_voip}
        screenProps['apns_token_error'] = apns_token_error
      }
      screenProps['lastMessage'] = lastMessage
    }
    return <MyNavBar screenProps={screenProps} />;
  }

  clearMessage = () => {
    this.setState({lastMessage:''})
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      NotificationsIOS.setBadgesCount(0);
    }
    this.setState({appState: nextAppState});
  }

  onPushRegistered(token) {
    console.log("Device Token Received", token);
    this.setState({token})
  }

  onPushRegistrationFailed(apns_token_error) {
    console.log("Device Token Error", apns_token_error);
    this.setState({apns_token_error})
  }

  onPushKitRegistered(token_voip) {
    this.setState({token_voip})
  }

  onNotificationReceivedForeground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  onNotificationReceivedBackground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

  onNotificationOpened(notification) {
    this.setState({lastMessage:notification.getMessage()})
  }

}

AppRegistry.registerComponent('PushApp', () => MyApp);
