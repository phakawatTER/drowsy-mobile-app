import React from 'react';
import { Image } from 'react-native';
import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import { Block, GalioProvider } from 'galio-framework';
import firebase from "firebase"
import Screens from './navigation/Screens';
import { Images, articles, argonTheme } from './constants';
import { config } from "./firebase-config"
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
  constructor() {
    super()
    this.state = {

    }
    this.setUserInfo = this.setUserInfo.bind(this)
    this.getUserInfo = this.getUserInfo.bind(this)
    try {
      firebase.initializeApp(config)
    } catch (err) { console.log(err) }
    firebase.database().ref().child("notification").child("-LrdlygY0H5IzMvDo-bh").on("child_added", (snapshot) => {

      console.log(this.state.userInfo)
      console.log(snapshot.val())
    })
  }

  loadUserInfo = async () => {
    let userInfo = await AsyncStorage.getItem("userInfo")
    userInfo = JSON.parse(userInfo)
    this.setState({ userInfo: userInfo }, () => {
      console.log("LOADNAJA", this.state)
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
