import React from "react";
import { StyleSheet } from "react-native";
import { Block, Text, theme } from "galio-framework";
import Icon from "./Icon";
import { MaterialCommunityIcons } from "@expo/vector-icons"
import argonTheme from "../constants/Theme";
import { AsyncStorage } from "react-native"

class DrawerItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      auth: false
    }
  }
  getUserInfo = async () => {
    let userInfo = await AsyncStorage.getItem("userInfo")
    userInfo = JSON.parse(userInfo)
    if (userInfo)
      this.setState({ auth: true })
    else
      this.setState({ auth: false })

  }
  componentDidMount() {
    this.getUserInfo()
  }
  componentWillReceiveProps(nextProps) {
    this.getUserInfo()
  }
  renderIcon = () => {
    const { title, focused } = this.props;

    switch (title) {
      case "Home":
        return (
          <Icon
            name="shop"
            family="ArgonExtra"
            size={10}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      case "Elements":
        return (
          <Icon
            name="map-big"
            family="ArgonExtra"
            size={12}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      case "Components":
        return (
          <Icon
            name="map-big"
            family="ArgonExtra"
            size={12}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      case "Articles":
        return (
          <Icon
            name="spaceship"
            family="ArgonExtra"
            size={12}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      case "Dashboard":
        return (
          <Icon
            name="chart-pie-35"
            family="ArgonExtra"
            size={12}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      // case "Profile":
      //   return (
      //     <Icon
      //       name="chart-pie-35"
      //       family="ArgonExtra"
      //       size={12}
      //       color={focused ? "white" : argonTheme.COLORS.ICON}
      //     />
      //   );
      case "History":
        return (
          <Icon
            name="calendar-date"
            family="ArgonExtra"
            size={12}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
        );
      case "Profile":
        return (
          <MaterialCommunityIcons
            name="face-profile"
            size={17.5}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
          // <Icon
          //   name="spaceship"
          //   family="ArgonExtra"
          //   size={12}
          //   color={focused ? "white" : argonTheme.COLORS.ICON}
          // />
        );
      case "Trip Video":
        return (
          <MaterialCommunityIcons
            name="face-profile"
            size={17.5}
            color={focused ? "white" : argonTheme.COLORS.ICON}
          />
          // <Icon
          //   name="spaceship"
          //   family="ArgonExtra"
          //   size={12}
          //   color={focused ? "white" : argonTheme.COLORS.ICON}
          // />
        );
      case "Getting Started":
        return <Icon />;
      case "Log out":
        return <Icon />;
      default:
        return null;
    }
  };

  render() {
    const { focused, title } = this.props;
    const { auth } = this.state
    const containerStyles = [
      styles.defaultStyle,
      focused ? [styles.activeStyle, styles.shadow] : null,
    ];

    return (
      <Block flex row style={containerStyles}>
        <Block middle flex={0.1} style={{ marginRight: 5 }}>
          {this.renderIcon()}
        </Block>
        <Block row center flex={0.9}>
          <Text
            size={15}
            bold={focused ? true : false}
            color={focused ? "white" : "rgba(0,0,0,0.5)"}
          >
            {title}
          </Text>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  hide: {
    display: "none"
  },
  defaultStyle: {
    paddingVertical: 15,
    paddingHorizontal: 14
  },
  activeStyle: {
    backgroundColor: argonTheme.COLORS.DEFAULT,
    backgroundColor: "#20232a",
    borderRadius: 4
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 8,
    shadowOpacity: 0.1
  }
});

export default DrawerItem;
