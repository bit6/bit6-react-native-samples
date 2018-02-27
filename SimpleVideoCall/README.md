## Simple Video Call Demo

Sample app for Bit6 video sessions in React Native

### Usage
- Clone the repository
- run in terminal

	```
	cd SimpleVideoCall
	npm install
	react-native link
	```

### Run in Android

1. Open Android Studio.
2. Import the project at `/android/` folder.
3. Run the project.


### Run in iOS

1. Open `/ios/SimpleVideoCall.xcodeproj` in Xcode.
2. Set a team for `SimpleVideoCall` and `SimpleVideoCallTests` targets.

	![Xcode import project](../img/ios-targets-teams.png)

3. Run the project.


	Note. you might get the error: `'WebRTC/RTCMTLVideoView.h' file not found`. In this case just comment this line:`#import <WebRTC/RTCMTLVideoView.h>` in `WebRTC.h` file.
