import { Platform, AsyncStorage } from 'react-native';

export class Bit6Session {

  static async login(identity){
      try {
        await AsyncStorage.setItem('@Bit6Session:identity', identity);
      }
      catch (error) {
      // Error saving data
      }
  }

  static async logout(){
      try {
        await AsyncStorage.removeItem('@Bit6Session:identity');
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

}
