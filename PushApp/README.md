## PushApp Demo

Sample app for sending/receiving push notifications using Bit6 Push Service in React Native.

Note: When running on iOS the user might disable permission for the regular push notifications, but the permission for VoIP notifications is always granted. In this case the demo will still work with support only for VoIP notifications.

### Usage

- Clone the repository
- Run in terminal

	```sh
	cd PushApp
	npm install
	```

### Run on Android

1. Open Android Studio
2. Import the project from `./android` folder.
3. Set your FCM `SenderId` in `AndroidManifest.xml`

	```xml
	<!-- Replace '1234567890' with your sender ID.
	IMPORTANT: Leave the trailing \0 intact!!! -->
	<meta-data android:name="com.wix.reactnativenotifications.gcmSenderId" android:value="1234567890\0"/>
	```

4. Run the project


### Run on iOS

1. Open `/ios/PushApp.xcodeproj` in Xcode
2. Set the bundle identifier in your targets. It has to match the one from the APNS certificate.
3. Set the team for `PushApp` and `PushAppTests` targets.
4. Run the project
