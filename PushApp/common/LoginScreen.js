import React from 'react';
import { View, TextInput, Button } from 'react-native';
import { AccessToken } from 'bit6';

import { MySession } from './MySession';

export class LoginScreen extends React.Component {
    static navigationOptions = {
        title: 'Bit6',
    };

  constructor(props,context) {
    super(props,context);

    this.state = {
      processing : true
    }
  }

  componentDidMount() {
    this._loadInitialState()
  }

  async _loadInitialState() {
      var device = await MySession.getDevice()
      var identity = await MySession.getIdentity()

      //has logged before
      if (device && identity) {
          this.setState({device, identity})
          this.fetchToken((jwt) => this.login(jwt))
      }
      else {
          this.setState({device, identity, processing:false})
      }
  }

  render() {
    const { identity, processing } = this.state

    return (
        <View style={{padding: 10}}>
          <TextInput style={{height: 40}} placeholder='Enter your username' onChangeText={(identity) => this.setState({identity})} autoCapitalize='none' value={identity}/>
          <Button onPress={() => {this.fetchToken((jwt) => this.login(jwt))}   } title='Login' disabled={processing}/>
        </View>
        )
  }

  fetchToken(handler) {
    const { identity, device } = this.state

    if (identity !== '') {
      fetch('https://bit6-demo-token-svc.herokuapp.com/token', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({identity,device})
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
       this.fetchToken((jwt) => {
           accessToken.update(jwt)
       })
    }.bind(this));

    MySession.setIdentity(this.state.identity)

    this.props.navigation.navigate('Messaging', { accessToken })
    this.setState({processing:false})
  }

}
