import { AppRegistry } from 'react-native';
import { StackNavigator } from 'react-navigation';

import { LoginScreen } from './LoginScreen';
import { MessagingScreen } from './MessagingScreen';

const MyNavBar = StackNavigator({
                                 Login: { screen: LoginScreen },
                                 Messaging: { screen: MessagingScreen }
                                 });

AppRegistry.registerComponent('SimpleMessaging', () => MyNavBar);
