## PushApp Demo

Sample app for sending/receiving push notifications using Bit6 Push Service in React Native.

##### Note. When running on iOS the user might disable access for the regular push notifications, but the access for voip_notifications is always granted. In this case the demo will continue with support only for VoIP notifications.

### Usage
- Clone the repository
- run in terminal

	```
	cd PushApp
	npm install
	```

### Run in Android

1. Open Android Studio.
2. Import the project at `/android/` folder.
3. Set your FCM `sender id` in the `AndroidManifest.xml`

	```
	// Replace '1234567890' with your sender ID.
	// IMPORTANT: Leave the trailing \0 intact!!!
	    <meta-data android:name="com.wix.reactnativenotifications.gcmSenderId" android:value="1234567890\0"/>
	```
	
3. Run the project.


### Run in iOS

1. Open `/ios/PushApp.xcodeproj` in Xcode.
2. Set the bundle identifier in your targets. It has to match the one from the APNS certificates.
3. Set a team for `PushApp ` and `PushAppTests` targets.
4. Run the project.
