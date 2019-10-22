import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ImageBackground,
  Platform,
  Animated
} from "react-native";
import { Block, Text, theme } from "galio-framework";

import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import { API_GET_NOTIFICATION_RECORD } from "../link"
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"
const { width, height } = Dimensions.get("screen");

const thumbMeasure = (width - 48 - 32) / 3;

class Profile extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      notificationRecs: [],
      isLoading: true,
      userInfo: {
        fname: "",
        lname: "",
        email: ""
      }
    }
    try {
      firebase.initializeApp(config)
    } catch (err) { }

  }
  loadUserInfo = async () => {
    let userInfo = await AsyncStorage.getItem("userInfo")
    userInfo = JSON.parse(userInfo)
    this.setState({ userInfo: userInfo }, () => {
    })
  }

  getNotificationRecord = () => {
    this.setState({ isLoading: true })
    AsyncStorage.getItem("userInfo").then(userInfo => {
      let { token, uid, from } = JSON.parse(userInfo)

      let payload = {
        user_id: uid,
        from: from
      }
      axios
        .create({
          headers: { "Content-Type": "application/json", token: token }
        })
        .post(API_GET_NOTIFICATION_RECORD, payload)
        .then(response => {
          let { code, result } = response.data
          if (code === 200) {
            this.setState({
              notificationRecs: result,
              isLoading: false
            }, () => {
              // reference to user collection
              let notificationRef = firebase
                .database().ref()
                .child("notification").child(uid).limitToLast(1)
              // child added listener
              notificationRef.on("child_added", (snapshot) => {
                let found = this.state.notificationRecs.find(obj => {
                  return obj.timestamp === snapshot.val().timestamp
                })
                if (!found) {
                  this.state.notificationRecs = [snapshot.val(), ... this.state.notificationRecs]
                  this.setState({ notificationRecs: this.state.notificationRecs })
                }
              })
            })
          }
        }).catch(err => {
          console.log(err)
        })
    }).catch(err => {
      console.log(err)
    })
  }


  componentWillMount() {
    // console.log(this.props.navigation)
    this.loadUserInfo()
    this.getNotificationRecord()
  }

  render() {
    const { fname, lname, profile } = this.state.userInfo
    return (
      <Block flex style={styles.profile}>
        <Block flex>
          <ImageBackground
            // source={Images.ProfileBackground}
            style={styles.profileContainer}
            imageStyle={styles.profileBackground}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width, marginTop: '25%' }}
            >
              <Block flex style={styles.profileCard}>
                <Block middle style={styles.avatarContainer}>
                  <Image
                    source={{ uri: profile ? null : Images.ProfilePicture }}
                    style={styles.avatar}
                  />
                </Block>
                <Block style={styles.info}>
                  <Block
                    middle
                    row
                    space="evenly"
                    style={{ marginTop: 20, paddingBottom: 24 }}
                  >
                    <Button
                      small
                      style={{ backgroundColor: argonTheme.COLORS.INFO }}
                    >
                      CONNECT
                    </Button>
                    <Button
                      small
                      style={{ backgroundColor: argonTheme.COLORS.DEFAULT }}
                    >
                      MESSAGE
                    </Button>
                  </Block>
                </Block>
                <Block flex>
                  <Block middle style={styles.nameInfo}>
                    <Text bold size={28} color="#32325D">
                      {fname} {lname}
                    </Text>
                    {/* <Text size={16} color="#32325D" style={{ marginTop: 10 }}>
                      San Francisco, USA
                    </Text> */}
                  </Block>
                  <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                    <Block style={styles.divider} />
                  </Block>

                  <Block>
                    <Text bold size={28} color="#32325D">
                      Drowsy Records
                    </Text>
                    <Text bold size={20}>
                      {this.state.notificationRecs.length} record(s)
                    </Text>
                    {
                      !this.state.isLoading ?
                        this.state.notificationRecs.map((record, index) => {
                          let { timestamp } = record
                          timestamp = moment(timestamp).format('dddd MMMM DD YYYY, h:mm:ss a')
                          return (
                            <Block key={index} middle size={17}>
                              <Text>
                                {timestamp}
                              </Text>
                            </Block>
                          )
                        })
                        : null
                    }

                  </Block>
                </Block>
              </Block>
            </ScrollView>
          </ImageBackground>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  profile: {
    marginTop: Platform.OS === "android" ? -HeaderHeight : 0,
    // marginBottom: -HeaderHeight * 2,
    flex: 1
  },
  profileContainer: {
    width: width,
    height: height,
    padding: 0,
    zIndex: 1
  },
  profileBackground: {
    width: width,
    height: height / 2
  },
  profileCard: {
    padding: theme.SIZES.BASE,
    marginHorizontal: theme.SIZES.BASE,
    marginTop: 65,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    zIndex: 2
  },
  info: {
    paddingHorizontal: 40
  },
  avatarContainer: {
    position: "relative",
    marginTop: -80
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 0
  },
  nameInfo: {
    marginTop: 35
  },
  divider: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#E9ECEF"
  },
  thumb: {
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: "center",
    width: thumbMeasure,
    height: thumbMeasure
  }
});

export default Profile;
