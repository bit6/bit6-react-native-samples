## APNS environment

To support push notifications for deployment from Xcode and TestFlight / App Store, the application needs to determine whether to use Production or Sandbox APNS connection. Follow these steps:

### 1. Add native helper method

Open your `AppDelegate` and add the following methods:

```objc
+ (BOOL)isSandboxApns {
#if TARGET_IPHONE_SIMULATOR
  return NO;
#else

  static BOOL isDevelopment = NO;

  NSData *data = [NSData dataWithContentsOfFile:[NSBundle.mainBundle pathForResource:@"embedded" ofType:@"mobileprovision"]];
  if (data) {
    const char *bytes = [data bytes];
    NSMutableString *profile = [[NSMutableString alloc] initWithCapacity:data.length];
    for (NSUInteger i = 0; i < data.length; i++) {
      [profile appendFormat:@"%c", bytes[i]];
    }
    NSString *cleared = [[profile componentsSeparatedByCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet] componentsJoinedByString:@""];
    isDevelopment = [cleared rangeOfString:@"<key>get-task-allow</key><true/>"].length > 0;
  }
  return isDevelopment;
#endif
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // Add this line
    NSDictionary *props = @{@"apnsSandbox" : @([AppDelegate isSandboxApns])};

    // Replace initialProperties:nil with initialProperties:props
    RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                        moduleName:@"PushApp"
                                                 initialProperties:props
                                                     launchOptions:launchOptions];
}
```

Now you will be able to access the prop `apnsSandbox` inside the top Component in your ReactNative JS code.


### 2. Access props.apnsSandbox in JS code

See in `App.js` for the example on how to pass the props to StackNavigator

```js
return <MyNavBar screenProps={this.props} />;
```

and then in `LoginScreen` the property can be accessed in this way:

```js
var service = this.props.screenProps.apnsSandbox ? 'apns-dev' : 'apns'
```
