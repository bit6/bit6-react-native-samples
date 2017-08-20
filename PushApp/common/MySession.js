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

  //PUSH INFO

  static async setPushInfo(pushInfo){
      try {
        if (pushInfo) {
            await AsyncStorage.setItem('@Bit6Session:pushInfo', JSON.stringify(pushInfo));
        }
        else {
            await AsyncStorage.removeItem('@Bit6Session:pushInfo');
        }
      }
      catch (error) {
      // Error saving data
      }
  }

  static async getPushInfo(){
      try {
        const value = await AsyncStorage.getItem('@Bit6Session:pushInfo');
        if (value){
          return JSON.parse(value)
        }
      } catch (error) {
        // Error retrieving data
      }
      return null
  }

}
