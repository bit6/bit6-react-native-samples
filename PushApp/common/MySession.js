import { Platform, AsyncStorage } from 'react-native';

export class MySession {

  static async setIdentity(identity){
      try {
         if (identity) {
           await AsyncStorage.setItem('@Bit6Session:identity', identity);
         }
         else {
           await AsyncStorage.removeItem('@Bit6Session:identity');
         }
      }
      catch (error) {
      // Error saving data
      }
  }

  static async getIdentity(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:identity');
        if (value){
          return value
        }
      } catch (error) {
        // Error retrieving data
      }
      return null
  }

  static async getDevice(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:device');
        if (value){
          return value
        }
      } catch (error) {
        // Error retrieving data
      }

      //generating a new device
      var device = (Platform.OS === 'ios' ? 'ios' : 'and') + Math.floor((Math.random() * 1000) + 1)
      try {
        await AsyncStorage.setItem('@Bit6Session:device', device);
      }
      catch (error) {
      // Error saving data
      }
      return device
  }

  //TOKENS

  static async setTokens(service, token, token_voip){
      try {
        if (service) {
            await AsyncStorage.setItem('@Bit6Session:service', service);
        }
        else {
            await AsyncStorage.removeItem('@Bit6Session:service');
        }

        if (token) {
            await AsyncStorage.setItem('@Bit6Session:token', token);
        }
        else {
            await AsyncStorage.removeItem('@Bit6Session:token');
        }

        if (token_voip) {
            await AsyncStorage.setItem('@Bit6Session:token_voip', token_voip);
        }
        else {
            await AsyncStorage.removeItem('@Bit6Session:token_voip');
        }
      }
      catch (error) {
      // Error saving data
      }
  }

  static async getService(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:service');
        if (value){
          return value
        }
      } catch (error) {
        // Error retrieving data
      }
      return null
  }

  static async getToken(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:token');
        if (value){
          return value
        }
      } catch (error) {
        // Error retrieving data
      }
      return null
  }

  static async getTokenVoIP(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:token_voip');
        if (value){
          return value
        }
      } catch (error) {
        // Error retrieving data
      }
      return null
  }

}
