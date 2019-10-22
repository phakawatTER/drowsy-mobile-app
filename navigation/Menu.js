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
  AsyncStorage.removeItem("userInfo").then(res => {
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
const Drawer = props => (
  <Block style={styles.container} forceInset={{ top: 'always', horizontal: 'never' }}>
    <Block flex={0.05} style={styles.header}>
      <Text bold size={20}>
        Drowsy Drowsy
      </Text>
    </Block>
    <Block flex>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <DrawerItems {...props} />
        <Block flex row style={styles.defaultStyle}>

          <Block middle flex={0.1} style={{ marginRight: 5 }}>
          </Block>
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
        </Block>
      </ScrollView>
    </Block>
  </Block>
);

const unAuthDrawer = ["Login", "Register"]
// const authDrawer = ["Profile", "Logout"]

sortedRouteStack = (props) => {
  let userInfo = props.screenProps.getUserInfo()
  let items = []
  if (userInfo) {
    items = props.items.filter(drawer => {
      return !unAuthDrawer.includes(drawer.key)
    })
  } else {
    items = props.items.filter(drawer => {
      return unAuthDrawer.includes(drawer.key)
    })
  }
  let cloneProps = {
    ...props,
    items: items
  }
  return cloneProps

}

const Menu = {
  contentComponent: props => {
    let cloneProps = sortedRouteStack(props)
    return (
      <Drawer {...cloneProps} />
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
