import React from 'react';
import { AppRegistry } from 'react-native';
import { StackNavigator } from 'react-navigation';

import { LoginScreen } from './LoginScreen';
import { MessagingScreen } from './MessagingScreen';

const MyNavBar = StackNavigator({
                                 Login: { screen: LoginScreen },
                                 Messaging: { screen: MessagingScreen }
                                 });

class MyApp extends React.Component {
  render() {
    console.log('this.props in MyApp', this.props); // This will list the initialProps.

    // StackNavigator **only** accepts a screenProps prop so we're passing
    // initialProps.appstore through that.
    return <MyNavBar screenProps={this.props} />;
  }
}

AppRegistry.registerComponent('PushApp', () => MyApp);
