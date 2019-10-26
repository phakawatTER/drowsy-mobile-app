import React from "react";
import { DrawerItems, StackActions, NavigationActions } from "react-navigation";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  View,
  Alert
} from "react-native";
import { Block, theme, Text } from "galio-framework";
import { AsyncStorage } from "react-native";
import Images from "../constants/Images";
import Theme from "../constants/Theme";
import { argonTheme, tabs } from "../constants/";

const { width } = Dimensions.get("screen");

clearStorage = (props) => {
  props.screenProps.logOut() // expire user session
  AsyncStorage.removeItem("userInfo").then(res => {
    props.screenProps.setUserInfo(null)
    props.navigation.navigate("Login")
  }).catch(err => { console.log(err) })
}

signOut = (props) => {
  Alert.alert(
    'Alert',
    'Do you really want to sign out?',
    [
      { text: 'Yes', onPress: () => clearStorage(props), style: 'cancel' },
      { text: 'No', onPress: () => { } },
    ]
  );
}
renderSignOutButton = (props) => {
  let userInfo = props.screenProps.getUserInfo()
  if (userInfo) {
    return (
      <Block row center flex={0.9}>
        <Text
          onPress={() => {
            signOut(props)
          }}
          bold
          color={argonTheme.COLORS.WARNING}
          size={15}
        >
          Sign out
          </Text>
      </Block>
    )
  }
  else
    return (
      <Block>
      </Block>
    )
}
const Drawer = props => {
  return (
    <Block style={styles.container} forceInset={{ top: 'always', horizontal: 'never' }}>
      <Block flex>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <Block flex={0.05} style={styles.header}>
            <Text bold size={20}>
              Drowsy Drowsy
        </Text>
          </Block>
          <DrawerItems {...props} />
          <Block flex row style={styles.defaultStyle}>

            <Block middle flex={0.1} style={{ marginRight: 5 }}>
            </Block>
            {
              renderSignOutButton(props)
            }
          </Block>
        </ScrollView>
      </Block>
    </Block>)

};


const Menu = {
  contentComponent: props => {
    return (
      <Drawer {...props} />
    )
  },
  drawerBackgroundColor: "white",
  drawerWidth: width * 0.8,
  contentOptions: {
    activeTintColor: "white",
    inactiveTintColor: "#000",
    activeBackgroundColor: "transparent",
    itemStyle: {
      width: width * 0.75,
      backgroundColor: "transparent"
    },
    labelStyle: {
      fontSize: 18,
      marginLeft: 12,
      fontWeight: "normal"
    },
    itemsContainerStyle: {
      paddingVertical: 16,
      paddingHorizonal: 12,
      justifyContent: "center",
      alignContent: "center",
      alignItems: "center",
      overflow: "hidden"
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: theme.SIZES.BASE,
    paddingTop: theme.SIZES.BASE * 3,
    justifyContent: 'center'
  }
});

export default Menu;
