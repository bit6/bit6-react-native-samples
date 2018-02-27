## Video Call Demo

Sample app for Bit6 video sessions in React Native with customizable publishing/subscribed media.

### Usage
- Clone the repository
- run in terminal

	```
	cd VideoCall
	npm install
	react-native link
	```

### Run in Android

1. Open Android Studio.
2. Import the project at `/android/` folder.
3. Run the project.


### Run in iOS

1. Open `/ios/VideoCall.xcodeproj` in Xcode.
2. Set a team for `VideoCall` and `VideoCallTests` targets.
3. Run the project.

	Note. you might get the error: `'WebRTC/RTCMTLVideoView.h' file not found`. In this case just comment this line:`#import <WebRTC/RTCMTLVideoView.h>` in `WebRTC.h` file.
