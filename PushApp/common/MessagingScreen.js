import React from 'react';
import { View, TextInput, Button, Platform, Text } from 'react-native';
import { Push } from 'bit6';

import {NotificationsAndroid} from 'react-native-notifications';
import NotificationsIOS from 'react-native-notifications';

import { Bit6Session } from './Bit6Session';

export class MessagingScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
                                                  title: `Logged as ${navigation.state.params.user}`,
                                                  headerLeft:
                                                    <Button title={'Logout'} onPress={() => {
                                                        navigation.state.params.pushSvc.unregister()
                                                        Bit6Session.logout()
                                                        navigation.goBack()
                                                        }}
                                                    />
                                                  });

  constructor(props,context) {
    super(props,context);

    this.state = {
      destination : '',
      message : '',
      lastMessage : '---'
    }

    var screen = this
    const { pushSvc } = this.props.navigation.state.params;

    if (Platform.OS === 'ios') {
        NotificationsIOS.addEventListener('notificationReceivedForeground', this.oniOSNotificationReceivedForeground.bind(this));
        NotificationsIOS.addEventListener('notificationReceivedBackground', this.oniOSNotificationReceivedBackground.bind(this));
        NotificationsIOS.addEventListener('notificationOpened', this.oniOSNotificationOpened.bind(this));
    }
    else {
        NotificationsAndroid.setNotificationReceivedListener(this.onAndroidNotificationOpened.bind(this));
        NotificationsAndroid.setNotificationOpenedListener(this.onAndroidNotificationReceived.bind(this));
    }
  }

  render() {
    const { lastMessage, message } = this.state;
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


            <Text style={{paddingTop: 40}}>Incoming message: {lastMessage}</Text>
            </View>
            )
  }

  sendMessage(topic) {
    const { destination, message } = this.state;
    if ( destination !== '' && message !== '' ) {
      const { pushSvc } = this.props.navigation.state.params;

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

  oniOSNotificationReceivedForeground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  	console.log("Notification Received - Foreground", notification);
  }

  oniOSNotificationReceivedBackground(notification) {
    this.setState({lastMessage:notification.getMessage()})
  	console.log("Notification Received - Background", notification);
  }

  oniOSNotificationOpened(notification) {
    this.setState({lastMessage:notification.getMessage()})
  	console.log("Notification opened by device user", notification);
  }

  onAndroidNotificationOpened(notification) {
      this.setState({lastMessage:notification.getMessage()})
      console.log("Notification opened by device user", notification.getData());
  }

  onAndroidNotificationReceived(notification) {
      this.setState({lastMessage:notification.getMessage()})
      console.log("Notification received on device", notification.getData());
  }

  componentWillUnmount() {
    // prevent memory leaks!
    if (Platform.OS === 'ios') {
      	NotificationsIOS.removeEventListener('notificationReceivedForeground', this.oniOSNotificationReceivedForeground.bind(this));
      	NotificationsIOS.removeEventListener('notificationReceivedBackground', this.oniOSNotificationReceivedBackground.bind(this));
      	NotificationsIOS.removeEventListener('notificationOpened', this.oniOSNotificationOpened.bind(this));
    }
  }
}
