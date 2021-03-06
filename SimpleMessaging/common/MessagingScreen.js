import React from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { Signal } from 'bit6';

export class MessagingScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
                                                  title: `Logged as ${navigation.state.params.accessToken.identity}/${navigation.state.params.accessToken.device}`,
                                                  });

  constructor(props,context) {
    super(props,context);

    this.signalSvc = new Signal(this.props.navigation.state.params.accessToken)

    this.state = {
      destination : '',
      message : '',
      incomingMsgUser : '',
      incomingMsg : ''
    }

    var screen = this
    this.signalSvc.on('message', function(msg) {
         console.log('Received direct signal', this);
         screen.setState({incomingMsgUser:msg.from.split('/')[0], incomingMsg:msg.text});
    });
  }

  render() {
    const { incomingMsgUser, incomingMsg, message } = this.state;
    const lastMessage = incomingMsgUser != '' ? `${incomingMsgUser} said: ${incomingMsg}` : ''
    return (
            <View style={{padding: 10}}>
            <TextInput style={{height: 40}} placeholder='Enter destination username' onChangeText={(destination) => this.setState({destination})} autoCapitalize='none'/>
            <TextInput style={{height: 40}} placeholder='Enter message' onChangeText={(message) => this.setState({message})} autoCapitalize='none' value={message}/>
            <Text>{lastMessage}</Text>
            <Button onPress={() => this.sendMessage()} title='Send'/>
            </View>
            )
  }

  sendMessage() {
    const { destination, message } = this.state;
    if ( destination !== '' && message !== '' ) {
      this.signalSvc.send( {to: destination, text: message} );
      this.setState({message:'' })
    }
  }
}
