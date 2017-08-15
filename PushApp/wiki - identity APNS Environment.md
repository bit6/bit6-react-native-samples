# PushApp

This demo requires to identify the APNS environment in which the iOS app is running, if Sandbox or Production. Follow the next steps:

##### step1. Get the APNS environment in your iOS code

Open your AppDelegate and add the following method:

```ObjC
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
    //add this
    NSDictionary *props = @{@"apnsSandbox" : @([AppDelegate isSandboxApns])};

    //and replace initialProperties:nil with initialProperties:props
    RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                        moduleName:@"PushApp"
                                               initialProperties:props
                                                        launchOptions:launchOptions];
}
```

Now you will be able to access the props "appstore" inside the top Component in your ReactNative JS code.

##### step2. Access props.appstore in JS code

See in `App.js` how to passed down the props to the StackNavigator

```js
return <MyNavBar screenProps={this.props} />;
```

and then in `LoginScreen` the property can be accessed in this way:

```js
var service = this.props.screenProps.apnsSandbox ? 'apns-dev' : 'apns'
```
