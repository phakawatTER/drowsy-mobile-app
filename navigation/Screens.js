import React from "react";
import { Easing, Animated } from "react-native";
import {
  createSwitchNavigator,
  createStackNavigator,
  createDrawerNavigator,
  createAppContainer
} from "react-navigation";

import { Block } from "galio-framework";
import Login from "../screens/Login";
import Register from "../screens/Register";
// screens
import Home from "../screens/Home";
import Onboarding from "../screens/Onboarding";
import Map from "../screens/Map";
import Profile from "../screens/Profile";
import Elements from "../screens/Elements";
import Articles from "../screens/Articles";
// drawer
import Menu from "./Menu";
import DrawerItem from "../components/DrawerItem";
import { AsyncStorage } from 'react-native';
// header for screens
import Header from "../components/Header";
import { argonTheme } from "../constants";

const transitionConfig = (transitionProps, prevTransitionProps) => ({
  transitionSpec: {
    duration: 400,
    easing: Easing.out(Easing.poly(4)),
    timing: Animated.timing
  },
  screenInterpolator: sceneProps => {
    const { layout, position, scene } = sceneProps;
    const thisSceneIndex = scene.index;
    const width = layout.initWidth;

    const scale = position.interpolate({
      inputRange: [thisSceneIndex - 1, thisSceneIndex, thisSceneIndex + 1],
      outputRange: [4, 1, 1]
    });
    const opacity = position.interpolate({
      inputRange: [thisSceneIndex - 1, thisSceneIndex, thisSceneIndex + 1],
      outputRange: [0, 1, 1]
    });
    const translateX = position.interpolate({
      inputRange: [thisSceneIndex - 1, thisSceneIndex],
      outputRange: [width, 0]
    });

    const scaleWithOpacity = { opacity };
    const screenName = "Search";

    if (
      screenName === transitionProps.scene.route.routeName ||
      (prevTransitionProps &&
        screenName === prevTransitionProps.scene.route.routeName)
    ) {
      return scaleWithOpacity;
    }
    return { transform: [{ translateX }] };
  }
});

const ElementsStack = createStackNavigator({
  Elements: {
    screen: Elements,
    navigationOptions: ({ navigation }) => ({
      header: <Header title="Elements" navigation={navigation} />
    })
  }
}, {
  cardStyle: {
    backgroundColor: "#F8F9FE"
  },
  transitionConfig
});

const ArticlesStack = createStackNavigator({
  Articles: {
    screen: Articles,
    navigationOptions: ({ navigation }) => ({
      header: <Header title="Articles" navigation={navigation} />
    })
  }
}, {
  cardStyle: {
    backgroundColor: "#F8F9FE"
  },
  transitionConfig
});

const ProfileStack = createStackNavigator(
  {
    Profile: {
      screen: Profile,
      navigationOptions: ({ navigation }) => ({
        header: (
          <Header title="Profile" navigation={navigation} />
        ),
        headerTransparent: true
      }),

    },
    Map: {
      screen: Map,
      navigationOptions: ({ navigation }) => ({
        header: (
          <Header left={<Block />} white transparent title="" navigation={navigation} />
        ),
        headerTransparent: true
      })
    }
  },
  {
    cardStyle: { backgroundColor: "#FFFFF" },
    transitionConfig
  }
);

const HomeStack = createStackNavigator({
  Home: {
    screen: Home,
    navigationOptions: ({ navigation }) => ({
      header: <Header search options title="Home" navigation={navigation} />
    })
  }
},
  {
    cardStyle: {
      backgroundColor: "#F8F9FE"
    },
    transitionConfig
  }
);

// Route for authentication step
const LoginScreen = createStackNavigator({
  Login: {
    screen: Login,
    navigationOptions: ({ navigation }) => ({
      header: <Header navigation={navigation} />
    })
  }

})

const RegisterScreen = createStackNavigator({
  Register: {
    screen: Register,
    navigationOptions: ({ navigation }) => ({
      header: <Header navigation={navigation} />
    })
  }
})


const UnAuthStack = createDrawerNavigator({
  Login: {
    screen: LoginScreen,
    navigationOptions: navOpt => ({
      drawerLabel: ({ focused }) => (
        <DrawerItem focused={focused} screen="Login" title="Sign in" />
      )
    })
  },
  Register: {
    screen: RegisterScreen,
    navigationOptions: navOpt => ({
      drawerLabel: ({ focused }) => (
        <DrawerItem focused={focused} screen="Register" title="Sign up" />
      )
    })
  },

}, Menu)

// console.log(AuthStack)
const AuthStack = createDrawerNavigator(
  {

    Profile: {
      screen: ProfileStack,
      navigationOptions: navOpt => ({
        drawerLabel: ({ focused }) => (
          <DrawerItem focused={focused} screen="Profile" title="Profile" />
        )
      })
    },

    Elements: {
      screen: ElementsStack,
      navigationOptions: navOpt => ({
        drawerLabel: ({ focused }) => (
          <DrawerItem focused={focused} screen="Elements" title="Elements" />
        )
      })
    },
    Articles: {
      screen: ArticlesStack,
      navigationOptions: navOpt => ({
        drawerLabel: ({ focused }) => (
          <DrawerItem focused={focused} screen="Articles" title="Articles" />
        )
      })
    },

  },
  Menu
);

const AppSwitch = createSwitchNavigator({
  UnAuthStack: UnAuthStack,
  AuthStack: AuthStack
})

const AppContainer = createAppContainer(AppSwitch);
export default AppContainer;
