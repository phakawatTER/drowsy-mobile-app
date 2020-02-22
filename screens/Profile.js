import React from "react";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Platform,
  View,
  Modal,
  FlatList,
  TouchableHighlight

} from "react-native";
import Spinner from "react-native-loading-spinner-overlay"
import { Block, Text, theme } from "galio-framework";
import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import { API_GET_NOTIFICATION_RECORD, SOCKET_ENDPOINT } from "../link"
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"
import Toast, { DURATION } from 'react-native-easy-toast'
import Header from "../components/Header"
import LiveStream from "../components/LiveStream";

const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;
var listWidth = 0

class Profile extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isLive: false,
      searchQuery: "",
      fadeOut: new Animated.Value(0),
      modalVisible: false,
      shouldFetch: true,
      headerHeight: 0,
      slides: [],
      notificationRecs: [],
      isLoading: true,
      displayPerPage: 15,
      currentUser: "",
      listIndex: 0,
      userInfo: {
        fname: "",
        lname: "",
        email: ""
      }
    }

    this.s = null
    this.modalRef = React.createRef()
    this.listRef = React.createRef()
    this.toastRef = React.createRef()
    this.livestreamRef = React.createRef()
    try {
      firebase.initializeApp(config)
    } catch (err) { }

  }

  fadeOut = () => {
    this.state.fadeOut.setValue(0)
    Animated.timing(
      this.state.fadeOut,
      {
        toValue: 1,
        duration: 10000
      }
    ).start()

  }

  loadUserInfo = async () => {
    let userInfo = await AsyncStorage.getItem("userInfo")
    userInfo = JSON.parse(userInfo)
    let { uid } = userInfo
    this.setState({ userInfo })
    this.notificationRef = firebase.database().ref().child("notification").child(uid).limitToLast(1)
    // child_added listener
    this.notificationRef.on("child_added", (snapshot) => {
      let found = this.state.notificationRecs.find(obj => {
        return obj.timestamp === snapshot.val().timestamp
      })
      // if new child added to the collection so update it 
      if (!found) {
        this.state.notificationRecs = [snapshot.val(), ... this.state.notificationRecs]
        this.setState({
          notificationRecs: this.state.notificationRecs,
          modalVisible: true
        })

      }
    })
  }

  setIsLive(isLive) {
    this.setState({ isLive })
  }

  componentWillReceiveProps(nextProps) {
    let headerHeight = nextProps.navigation.getParam("headerHeight")
    // recieve the height of header 
    if (this.state.headerHeight !== headerHeight) {
      this.setState({ headerHeight: headerHeight })
    }
  }

  componentWillMount() {
    this.getNotificationRecord()
    const { navigation } = this.props;
    this.props.navigation.setParams({
      profileSearch: this.searchEvent
    })
    this.focusListener = navigation.addListener('didFocus', () => {
      const { notificationRecs } = this.state
      this.loadUserInfo()
    });
    this.leaveListener = navigation.addListener('didBlur', () => {
      this.setState({ searchQuery: "" })
    })
    try {
      this.notificationRef.off("child_added")
    } catch (err) { }
  }

  componentDidUpdate(nextProps, nextState) {

    // IF NEW EVENT ADDED INTO THE RECORD SO ANIMATE LATEST BLOCK BACKGROUND
    if (this.state.notificationRecs.length !== 0 && this.state.modalVisible) {
      if (nextState.notificationRecs.length !== this.state.notificationRecs) {
        this.fadeOut()
      }
    }
  }


  searchEvent = (query) => {
    this.setState({ searchQuery: query })

  }

  showModal = () => {
    this.modalRef.current.setModalVisible(true)
  }

  updateNotificationStatus = (pushID) => {
    if (pushID === undefined) return
    let { userInfo, notificationRecs } = this.state
    let { uid } = userInfo
    let notification = firebase.database().ref().child(`notification/${uid}/${pushID}`)
    notification.update({
      read: true
    }, (err) => {
      if (err) return console.log("Cannot update notification status")
      else {
        notificationRecs = notificationRecs.map((obj, index) => {
          let { id } = obj
          if (id == pushID) notificationRecs[index].read = true

          return obj
        })
      }
    })
  }

  getNotificationRecord = () => {
    this.setState({
      isLoading: true,
    })
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
            })
          } else {
            // console.log(code)
          }
        }).catch(err => {
          this.setState({ isLoading: false })
          console.log(err)
        })
    }).catch(err => {
      this.setState({ isLoading: false })
      console.log(err)
    })
  }

  onScrollEnd = (e) => {
    let contentOffset = e.nativeEvent.contentOffset;
    let viewSize = e.nativeEvent.layoutMeasurement;

    // Divide the horizontal offset by the width of the view to see which page is visible
    let pageNum = Math.floor(contentOffset.x / viewSize.width);
    this.setState({
      listIndex: pageNum
    })
  }

  updateUserInfo = (fname, lname, profile) => {
    // alert("Updated")
    let { userInfo } = this.state
    userInfo.fname = fname,
      userInfo.lname = lname
    userInfo.profile = profile
    this.setState({ userInfo }, () => {
      // console.log(this.state.userInfo)
    })
  }


  renderRecords = () => {
    let { notificationRecs, searchQuery } = this.state
    searchQuery = searchQuery.toLowerCase()
    let tmp_notificationRecs = [...notificationRecs]
    tmp_notificationRecs = tmp_notificationRecs.filter(data => {
      let { event, timestamp } = data
      timestamp = moment(timestamp).format("DD-MM-YYYY  hh:mm:ss a").toString()
      return timestamp.includes(searchQuery) || event.toLowerCase().includes(searchQuery)
    })
    let slides = []
    var count = 0
    while (tmp_notificationRecs.length !== 0) {
      let group = tmp_notificationRecs.slice(0, this.state.displayPerPage)
      tmp_notificationRecs.splice(0, this.state.displayPerPage)
      slides[count] = group
      count = count + 1
    }


    return (
      <Block>
        <FlatList
          pagingEnabled={true}
          ref={this.listRef}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={this.onScrollEnd}
          horizontal
          data={slides}
          renderItem={this._renderItem}
        />
        <Block middle style={{ flexDirection: "row", paddingTop: 25 }}>
          {
            slides.map((el, index) => {
              return (
                <View style={{ ...styles.pagination, ...index === this.state.listIndex ? styles.activeDotStyle : styles.dotStyle }}></View>
              )
            })
          }
        </Block>
      </Block >
    )
  }

  _renderItem = ({ item, dimensions }) => {

    return (
      <Block style={{ width: listWidth }} >
        {
          item.map((obj, key) => {
            let { timestamp, event, direction, read, id, speed } = obj

            let img = Images.iconEvent[event]
            let { timestamp: latestTimestamp } = this.state.notificationRecs[0] // TIMESTAMP OF THE LATEST EVENT

            datetime = moment(timestamp).format("DD-MM-YYYY  hh:mm:ss a")
            return (
              <Animated.View
                style={{
                  marginLeft: 0,
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                  borderRadius: 5,
                  ...read === false ? { backgroundColor: "#20232a" } : {}

                }}
                key={`event-${key}`} >
                <Block
                  left
                  space="evenly"
                  style={{
                    paddingVertical: 10,
                  }}
                >
                  <Block row>
                    <Image source={img} style={{ width: 25, height: 25 }} />
                    <Text bold style={{ color: read == false ? "#fff" : "#000" }}> {event}</Text>
                  </Block>
                  <Block
                    left
                    row
                    space="evenly"
                    style={{ width: "100%" }}
                  >
                    <Block>
                      <Text style={{ color: read == false ? "#fff" : "#000" }}>
                        Occured date:{" "}
                        {datetime}
                      </Text>
                    </Block>
                    <Block space="evenly" middle>
                      <Button
                        onPress={() => {
                          // this.updateNotificationStatus()
                          // Navigate to map and send values
                          this.updateNotificationStatus(id)
                          this.props.navigation.navigate("Map", {
                            handle: "display",
                            speed,
                            time: datetime,
                            latlng: obj.latlng, // latitude and longtitude of drowsiness
                            back: "Profile", // location when press back
                            event: event
                          })
                        }}
                        small
                        style={{ backgroundColor: read == false ? argonTheme.COLORS.INPUT_SUCCESS : "#20232a", paddingHorizontal: 0, paddingVertical: 0 }}
                      >
                        <Text color={"white"} bold>
                          <MaterialCommunityIcons
                            name="map-marker-radius"
                            size={12}
                            color="white"
                          />
                          {" "}
                          Detail
                        </Text>
                      </Button>
                    </Block>
                  </Block>
                </Block>
                <Block style={styles.divider} />
              </Animated.View>
            )
          })
        }
      </Block >
    )
  };


  render() {
    const { fname, lname, profile, regisdate } = this.state.userInfo
    const { stream_image, isLive } = this.state

    const notificationModal = () => (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.state.modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
        }}>
        <View style={{ ...styles.dimmer }} >
          <Toast
            onPress={() => {
              let latestDrowsy = this.state.notificationRecs[0]
              let { latlng, timestamp } = latestDrowsy
              datetime = moment(timestamp).format("DD-MM-YYYY hh:mm:ss")
              this.props.navigation.navigate("Map", {
                handle: "display",
                time: datetime,
                latlng: latlng,
                back: "Profile"
              })
            }}
            ref={this.toastRef}
            defaultCloseDelay={1500}
            style={{ backgroundColor: argonTheme.COLORS.ERROR }}
            position={"top"}
            positionValue={this.state.headerHeight - 10}
            opacity={0.9} />
        </View>
      </Modal>
    )


    return (
      <>
        <Block flex >
          <Spinner
            visible={this.state.isLoading}
            textStyle={styles.spinnerTextStyle}
          />

          <LiveStream
            ref={this.livestreamRef}
            
            setIsLive={this.setIsLive.bind(this)}
          />
          <ScrollView
            vertical={true}
            showsVerticalScrollIndicator={false}
            style={{
              width,
              marginTop: Platform.OS === "ios" ? this.state.headerHeight : 0,
            }}
          >
            <Block flex style={{ ...styles.profileCard }}>
              <Block middle style={styles.avatarContainer}>
                <Image
                  source={profile ? { uri: profile } : Images.defaultAvatar}
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
                    onPress={() => {
                      this.props.navigation.navigate("EditProfile", {
                        userInfo: this.state.userInfo,
                        updateUserInfo: this.updateUserInfo.bind(this)
                      })
                    }}
                    small
                    style={{ backgroundColor: argonTheme.COLORS.INPUT_SUCCESS }}
                  >
                    <Text color="white" bold>
                      <MaterialIcons name={"settings"} size={12} />
                      {" "}
                      Edit
                  </Text>
                  </Button>
                  <Button
                    small
                    style={{ backgroundColor: argonTheme.COLORS.DEFAULT }}
                    onPress={() => {
                      this.props.navigation.navigate("Map", {
                        handle: "tracking",
                        back: "Profile"
                      })
                    }}
                  >
                    <Text color="white" bold>
                      <MaterialIcons name={"map"} size={12} />
                      {" "}
                      Track
                  </Text>
                  </Button>
                  <Button
                    small
                    style={{ backgroundColor: isLive ? "crimson" : "grey" }}
                    onPress={() => {
                      if (!isLive) return
                      this.livestreamRef.current.showLiveStream(true)
                    }}
                  >
                    <Text color="white" bold>
                      <MaterialIcons name={"live-tv"} size={12} />
                      {" "}
                      Live
                  </Text>
                  </Button>
                </Block>


              </Block>

              <Block flex>
                <Block middle style={styles.nameInfo}>
                  <Text bold size={28} color="#32325D">
                    {fname} {lname}
                  </Text>
                </Block>
                <Block middle style={styles.nameInfo}>
                  <Text size={15} color="#32325D">
                    <Text bold>Registered date:</Text> {moment(regisdate).format("DD-MM-YYYY hh:mm:ss a")}
                  </Text>
                </Block>
                <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                  <Block style={styles.divider} />
                </Block>
                <Block>
                  <Text bold size={28} color="#32325D">
                    Event Records
                    </Text>
                  {
                    this.state.searchQuery === "" ?
                      <Text size={20}>
                        total
                    <Text color={argonTheme.COLORS.WARNING}> {this.state.notificationRecs.length} </Text>
                        record(s)
                  </Text> :
                      <Text size={20}>
                        searching for
                    "<Text color={argonTheme.COLORS.WARNING}> {this.state.searchQuery} </Text>"
                  </Text>
                  }

                  <Block style={{ paddingTop: 20, paddingBottom: 30 }}
                    onLayout={(event) => {
                      var { x, y, width, height } = event.nativeEvent.layout;
                      listWidth = width
                    }}
                  >
                    {
                      this.state.isLoading ? null :
                        this.renderRecords()
                    }
                  </Block>
                </Block>
              </Block>
            </Block>
          </ScrollView>
        </Block >
      </>
    );
  }
}

const styles = StyleSheet.create({
  liveLogo: {
    backgroundColor: "crimson",
    position: "absolute",
    top: 10,
    left: 2.5,
    padding: 5,
    borderRadius: 2.5
  },
  dimmer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    minWidth: width,
    minHeight: height,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },

  activeDotStyle: {
    backgroundColor: 'rgba(0, 0, 0, .7)',
  },
  dotStyle: {
    backgroundColor: 'rgba(0, 0, 0, .2)',
  },
  pagination: {
    marginHorizontal: 1.25,
    borderRadius: 5,
    backgroundColor: "black",
    width: 10,
    height: 10,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  image: {
    width: 320,
    height: 320,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 16,
  },
  recordContainer: {
    paddingTop: 20
  },
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
    marginTop: 80,
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
    borderWidth: 1,
  },
  nameInfo: {
    marginTop: 35
  },
  divider: {
    width: "100%",
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
