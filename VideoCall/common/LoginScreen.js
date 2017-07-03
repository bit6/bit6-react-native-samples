import React from 'react';
import { View, TextInput, Button } from 'react-native';
import { AccessToken, Signal } from 'bit6';

export class LoginScreen extends React.Component {
  static navigationOptions = {
  title: 'Bit6',
  };

  constructor(props,context) {
    super(props,context);

    this.state = {
      username : '',
      loging : false
    }
  }

  render() {
    return (
            <View style={{padding: 10}}>
            <TextInput style={{height: 40}} placeholder='Enter your username' onChangeText={(username) => this.setState({username})} autoCapitalize='none' value={this.state.username}/>
            <Button onPress={() => this.generateJWT((jwt) => this.login(jwt))} title='Login' disabled={this.state.loging}/>
            </View>
            )
  }

  generateJWT(handler) {
    if (this.state.username !== '') {
      this.setState({loging:true})
      fetch('https://bit6-demo-token-svc.herokuapp.com/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                                 identity: this.state.username,
                                 device: 'web1',
                                 })
            })
      .then((response) => response.json())
      .then((responseJson) => {
            handler(responseJson.token);
            this.setState({loging:false})
            })
      .catch((error) => {
             console.error(error);
             this.setState({loging:false})
             });
    }
  }

  login(jwt) {
    var accessToken = new AccessToken(jwt);
    accessToken.on('expired', function(t) {
       console.log('AccessToken expired, need to renew', t);
       this.generateJWT((jwt) => accessToken.update(jwt))
    });

    var signalSvc = new Signal(accessToken);

    const { navigate } = this.props.navigation;
    const { username } = this.state;
    
    navigate('Calling', { username, signalSvc })
  }

}
