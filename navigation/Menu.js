import React from "react";
import { DrawerItems, StackActions, NavigationActions } from "react-navigation";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  Image
} from "react-native";
import { Block, theme } from "galio-framework";
import { AsyncStorage } from "react-native";
import Images from "../constants/Images";


const { width } = Dimensions.get("screen");

const Drawer = props => (
  <Block style={styles.container} forceInset={{ top: 'always', horizontal: 'never' }}>
    <Block flex={0.05} style={styles.header}>
      <Image styles={styles.logo} source={Images.Logo} />
    </Block>
    <Block flex>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <DrawerItems {...props} />
      </ScrollView>
    </Block>
  </Block>
);

const unAuthDrawer = ["Login", "Register"]
const authDrawer = ["Profile", "Logout"]

loadUserInfo = async () => {
  let userInfo = await AsyncStorage.getItem("userInfo")
  userInfo = JSON.parse(userInfo)
  return userInfo
}



resetStackNavigators = (props, userInfo) => {
  let stacks = [...props.items]
  let sortedStack = []
  console.log(props)
  const resetStack = StackActions.reset({
    index: 0,
    actions: [
      NavigationActions.navigate({ routeName: 'Home' }),
    ],
    key: "Login"
  })
  props.navigation.dispatch(resetStack)
  return sortedStack
}

const Menu = {
  contentComponent: props => {
    let userInfo = loadUserInfo()
    resetStackNavigators(props, userInfo)
    const cloneProps = {
      ...props,
      items: props.items.filter((drawer, index) => {
        // auth
        if (userInfo) { return !unAuthDrawer.includes(drawer.key) }
        else {
          !authDrawer.includes(drawer.key)
        }
      })

    }
    return <Drawer {...cloneProps} />
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
