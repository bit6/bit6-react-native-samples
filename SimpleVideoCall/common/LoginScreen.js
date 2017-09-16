import React from 'react';
import { View, TextInput, Button, Platform } from 'react-native';
import { AccessToken } from 'bit6';

export class LoginScreen extends React.Component {
  static navigationOptions = {
  title: 'Bit6',
  };

  constructor(props,context) {
    super(props,context);

    this.state = {
      device: (Platform.OS === 'ios' ? 'ios' : 'and') + Math.floor((Math.random() * 1000) + 1),
      username : '',
      processing : false
    }
  }

  render() {
    return (
            <View style={{padding: 10}}>
            <TextInput style={{height: 40}} placeholder='Enter your username' onChangeText={(username) => this.setState({username})} autoCapitalize='none' value={this.state.username}/>
            <Button onPress={() => this.fetchToken((jwt) => this.login(jwt))} title='Login' disabled={this.state.processing}/>
            </View>
            )
  }

  fetchToken(handler) {
    const { username, device } = this.state

    if (username !== '') {
      this.setState({processing:true})
      fetch('https://bit6-demo-token-svc.herokuapp.com/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                                 identity: username,
                                 device: device,
                                 })
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
    var accessToken = new AccessToken(jwt);
    accessToken.on('expired', function(t) {
       console.log('AccessToken expired, need to renew', t);
       this.fetchToken((jwt) =>
           accessToken.update(jwt))
    });
    
    this.props.navigation.navigate('Calling', { accessToken })
    this.setState({processing:false})
  }

}
