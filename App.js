import React from 'react';
import { Image } from 'react-native';
import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import { Block, GalioProvider } from 'galio-framework';
import firebase from "firebase"
import Screens from './navigation/Screens';
import { Images, articles, argonTheme } from './constants';
import { config } from "./firebase-config"
import { AsyncStorage } from "react-native"
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
      userInfo: null
    }
    this.setUserInfo = this.setUserInfo.bind(this)
    this.getUserInfo = this.getUserInfo.bind(this)
    this.screenRef = React.createRef()
    try {
      firebase.initializeApp(config)
    } catch (err) {
      console.log(err)
    }
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
            if (token !== latestToken) {
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
  componentWillMount() {
    this.loadUserInfo()
  }

  setUserInfo = (userInfo) => {
    this.setState({ userInfo: userInfo })
  }
  getUserInfo = () => {
    return this.state.userInfo
  }

  state = {
    isLoadingComplete: false,
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
                setUserInfo: this.setUserInfo,
                getUserInfo: this.getUserInfo
              }}
            />
          </Block>
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
