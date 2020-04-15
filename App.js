import React from 'react';
import { Image, Modal } from 'react-native';
import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import { Block, GalioProvider } from 'galio-framework';
import firebase from "firebase"
import Screens from './navigation/Screens';
import { Images, articles, argonTheme } from './constants';
import { config } from "./firebase-config"
import { AsyncStorage } from "react-native"
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import { API_LOGOUT } from "./link"
import axios from "axios"
import { Audio } from "expo-av"
import { Platform, Switch } from "react-native"
import DropdownAlert from 'react-native-dropdownalert';
import LiveStream from "./components/LiveStream";

let event_count = 0
let trip_count = 0
// cache app images
const assetImages = [
  Images.Onboarding,
  Images.LogoOnboarding,
  Images.Logo,
  Images.Pro,
  Images.ArgonLogo,
  Images.iOSLogo,
  Images.androidLogo
];

// cache product images
articles.map(article => assetImages.push(article.image));

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      trip_vdo_uri: null,
      showLive: false,
      isLive: false,
      userInfo: null,
      notifications: []
    }
    this.setHeaderHeight = this.setHeaderHeight.bind(this)
    this.getHeaderHeight = this.getHeaderHeight.bind(this)
    this.setUserInfo = this.setUserInfo.bind(this)
    this.getUserInfo = this.getUserInfo.bind(this)
    this.addNewNotification = this.addNewNotification.bind(this)
    this.screenRef = React.createRef()

    try {
      firebase.initializeApp(config)
    } catch (err) {
      console.log(err)
    }
  }

  addNewNotification = (notification) => {
    let { notifications } = this.state
    notifications.push(notification)
    this.setState({ notifications })
  }

  registerForPushNotification = async () => {
    const { uid } = this.state.userInfo
    const expoPushToken = this.state.userInfo.expoPushToken
    const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS)
    let finalStatus = existingStatus
    console.log(finalStatus)
    if (finalStatus !== "granted" || !expoPushToken) {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status
    }
    if (finalStatus !== "granted") {
      return
    }
    let token = await Notifications.getExpoPushTokenAsync()
    console.log(token)
    // update push token to this user
    if (expoPushToken !== token) {
      firebase.database().ref().child("user").child(uid).update({
        expoPushToken: token
      })
    }
  }

  logOut = () => {
    let { uid, from, token } = this.state.userInfo
    axios
      .create({
        headers: {
          "Content-Type": "application/json",
          token: token
        }
      })
      .post(API_LOGOUT, {
        uid: uid,
        from: from
      })
      .then(response => {
        trip_count = 0
        event_count = 0
        console.log(response.data)
      })
      .catch(err => {
        console.log(err)
      })
  }

  loadUserInfo = async () => {
    let userInfo = await AsyncStorage.getItem("userInfo")
    userInfo = JSON.parse(userInfo)
    this.setState({ userInfo: userInfo }, () => {
      if (userInfo) {
        let { uid } = userInfo
        let loginRef = firebase.database().ref()
          .child("login").child(uid).child("app").orderByKey().limitToLast(1)
        // TO DETECT DUBPLICATE LOGIN
        // APP USER ARE NOT ALLOWED TO LOGGED IN DUBPLICATEDLY
        loginRef.on("child_added", (snapshot) => {
          AsyncStorage.getItem("userInfo").then(_userInfo => {
            _userInfo = JSON.parse(_userInfo)
            let { token } = _userInfo
            let loginInfo = snapshot.val()
            let latestToken = loginInfo.token
            // Duplicated log in occurs force user to log out of the app
            if (token !== latestToken) {
              this.logOut() // expire user token
              AsyncStorage.removeItem("userInfo").then(data => {
                alert("Someone has logged in into your account. Your token has been expired!")
                this.screenRef.current._navigation.navigate("Login")
              }).catch(err => {
                console.log(err)
              })
            }
          }).catch(err => {
            console.log(err)
          })

        })
      }
    })
  }

  componentDidUpdate(prevProps, prevState) {

    if (prevState.userInfo !== this.state.userInfo) {
      // if user info exists
      if (this.state.userInfo) {
        this.registerForPushNotification()
        let { uid } = this.state.userInfo
        this.databaseRef = firebase.database().ref()
        this.notificationRef = this.databaseRef.child("notification").child(uid).limitToLast(1)
        this.tripRef = this.databaseRef.child(`usertrips/${uid}`).limitToLast(1)
        this.tripRef.on("child_added", (snapshot) => {
          if (trip_count == 0) {
            trip_count += 1
            return
          }
          this.dropDownAlertRef.alertWithType('success', 'Trip alert!', `New trip has started !!`);

        })
        // child_added listener
        this.notificationRef.on("child_added", (snapshot) => {
          if (event_count == 0) {
            event_count += 1
            return
          }
          let { event, timestamp } = snapshot.val()
          // if new child added to the collection so update it 
          try {
            if (["Dangerous Eye Close", "Fatigue"].includes(event)) {
              this.dropDownAlertRef.alertWithType('error', 'Event alert!', `Event "${event}" detected !!`);
              // play alarm sound
              const soundObject = new Audio.Sound();
              try {
                soundObject.loadAsync(require('./assets/audio/alarm.mp3')).then(response => {
                  soundObject.playAsync();
                  setTimeout(() => {
                    soundObject.stopAsync()
                  }, 2000)
                })
              } catch (err) {
                console.log(err)
              }
            } else {
              this.dropDownAlertRef.alertWithType('warn', 'Event alert!', `Event "${event}" detected !!`);
            }
          } catch (err) {
          }
        })
      } else {
        this.notificationRef.off("child_added")
      }
    }
  }
  componentDidMount() {
    this.loadUserInfo()

  }

  setUserInfo = (userInfo) => {
    this.setState({ userInfo: userInfo })
  }
  getUserInfo = () => {
    return this.state.userInfo
  }


  setHeaderHeight = (size) => {
    this.setState({
      headerHeight: size
    })
  }

  getHeaderHeight = () => {
    return this.state.headerHeight
  }

  state = {
    isLoadingComplete: false,
  }

  setShowLive(showLive, trip_vdo_uri, trip_acctime) {
    this.setState({ showLive, trip_vdo_uri, trip_acctime })
  }
  setIsLive(isLive) {
    this.setState({ isLive })
  }
  toggleLiveStream = () => {
    let { showLive } = this.state
    this.setState({ showLive: !showLive })
  }

  render() {
    if (!this.state.isLoadingComplete) {

      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {

      return (
        <GalioProvider theme={argonTheme}>

          <Block flex>
            <Screens
              ref={this.screenRef}
              screenProps={{
                setShowLive: this.setShowLive.bind(this),
                isLive: this.state.isLive,
                logOut: this.logOut,
                setUserInfo: this.setUserInfo,
                getUserInfo: this.getUserInfo,
                setHeaderHeight: this.setHeaderHeight,
                getHeaderHeight: this.getHeaderHeight,
                addNewNotification: this.addNewNotification
              }}
            />
          </Block>
          <LiveStream
            ref={this.livestreamRef}
            userInfo={this.state.userInfo}
            showLive={this.state.showLive}
            vdo_uri={this.state.trip_vdo_uri}
            trip_acctime={this.state.trip_acctime}
            setShowLive={this.setShowLive.bind(this)}
            setIsLive={this.setIsLive.bind(this)}
          />

          <DropdownAlert
            zIndex={1000}
            ref={ref => { this.dropDownAlertRef = ref }}
          />
        </GalioProvider>
      );
    }
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      ...cacheImages(assetImages),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };

}
