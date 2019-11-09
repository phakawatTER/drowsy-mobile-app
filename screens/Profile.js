import React from "react";
import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions';
import {
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ImageBackground,
  Platform,
  View,
  Modal,
  FlatList,
  BackHandler,
  TouchableHighlight

} from "react-native";
import Spinner from "react-native-loading-spinner-overlay"
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
import { Audio } from 'expo-av';
import Toast, { DURATION } from 'react-native-easy-toast'

const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;
var listWidth = 0

class Profile extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
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
    this.modalRef = React.createRef()
    this.listRef = React.createRef()
    this.toastRef = React.createRef()
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
    this.setState({ userInfo: userInfo }, () => {
    })
  }

  componentWillMount() {
    this.loadUserInfo()
    this.getNotificationRecord()
  }


  componentWillReceiveProps(nextProps) {
    let headerHeight = nextProps.navigation.getParam("headerHeight")
    // recieve the height of header 
    if (this.state.headerHeight !== headerHeight) {
      this.setState({ headerHeight: headerHeight })
    }
  }

  componentDidMount() {
    this.getCalendarPermission()
    // this.createCalendarEvent()
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didFocus', () => {
      const { notificationRecs } = this.state
      if (notificationRecs.length === 0) {
        this.getNotificationRecord()
      }
    });
  }

  componentDidUpdate(nextProps, nextState) {

    // IF NEW EVENT ADDED INTO THE RECORD SO ANIMATE LATEST BLOCK BACKGROUND
    if (this.state.notificationRecs.length !== 0 && this.state.modalVisible) {
      if (nextState.notificationRecs.length !== this.state.notificationRecs) {
        this.fadeOut()
      }
    }
  }

  componentWillUnmount() {
    let notificationRef = firebase
      .database().ref()
      .child("notification").child(uid).limitToLast(1)
    notificationRef.off("child_added") // turn off notification on when unmount
  }

  getCalendarPermission = async () => {
    let { status } = await Permissions.getAsync(Permissions.CALENDAR)
    if (status !== "granted") {
      status = await Permissions.askAsync(Permissions.CALENDAR)
    }
    console.log(status)
  }

  createCalendarEvent = async () => {
    await Calendar.getCalendarsAsync().then(data => {
      let calendar = data.find(calendar => {
        return calendar.title === "Calendar"
      })
      console.log(calendar)
      Calendar.createEventAsync(calendar.id, {
        endDate: moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.sssZ").toString(),
        location: "...",
        notes: "...",
        startDate: moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.sssZ").toString(),
        // timeZone: "GMT-7",
        title: "TEST NAJA",
        url: "http://www...",
        // title: "ALARM TEST",
        // startDate: new Date(),
        alarms: [{ relativeOffset: 0 }]
      }).then(data => {
        console.log(data)
      }).catch(err => {
        console.log(err)
      })

    }).catch(err => { console.log(err) })

  }

  showModal = () => {
    this.modalRef.current.setModalVisible(true)
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
              // realtime listener to new coming events
              // reference to user collection
              let notificationRef = firebase
                .database().ref()
                .child("notification").child(uid).limitToLast(1)
              // child_added listener
              notificationRef.on("child_added", (snapshot) => {
                let found = this.state.notificationRecs.find(obj => {
                  return obj.timestamp === snapshot.val().timestamp
                })
                // if new child added to the collection so update it 
                if (!found) {
                  this.state.notificationRecs = [snapshot.val(), ... this.state.notificationRecs]
                  this.setState({
                    notificationRecs: this.state.notificationRecs,
                    modalVisible: true
                  }, () => {
                    let data = snapshot.val()
                    // show toast
                    let { timestamp } = data
                    timestamp = moment(timestamp).format("DD-MM-YYYY HH:MM:ss a")
                    this.toastRef.current.show(`Driver Drowsiness Detected! ${timestamp} `, 1500, () => {
                      this.setState({ modalVisible: false })
                    });
                  })
                  // play alarm sound
                  const soundObject = new Audio.Sound();
                  try {
                    soundObject.loadAsync(require('../assets/audio/alarm.mp3')).then(response => {
                      soundObject.playAsync();
                      setTimeout(() => {
                        soundObject.stopAsync()
                      }, 2000)
                    })
                  } catch (err) {
                    console.log(err)
                  }
                }
              })
            })
          } else {
            console.log(code)
          }
        }).catch(err => {
          console.log(err)
        })
    }).catch(err => {
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
  renderRecords = () => {
    let { notificationRecs } = this.state
    let tmp_notificationRecs = [...notificationRecs]
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
            let { timestamp, event } = obj
            let { timestamp: latestTimestamp } = this.state.notificationRecs[0] // TIMESTAMP OF THE LATEST EVENT
            datetime = moment(timestamp).format("DD-MM-YYYY  hh:MM:ss a")
            return (
              <Animated.View
                style={{
                  marginLeft: 0,
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                  // IF LATEST TIMESTAMP = TIMESTAMP THEN ANIMATE BACKGROUND COLOR
                  ...timestamp === latestTimestamp && this.state.modalVisible ? {
                    backgroundColor: this.state.fadeOut.interpolate({
                      inputRange: [0, 1],
                      outputRange: [argonTheme.COLORS.ERROR, "rgba(255,255,255,1)"]
                    })
                  } : {}
                }}
                key={`event-${key}`} >
                <Block
                  middle
                  row
                  space="evenly"
                  style={{
                    paddingVertical: 10,
                  }}
                >
                  <Text>
                    <Text bold>{event}</Text> {datetime}
                  </Text>
                  <Button
                    onPress={() => {
                      // Navigate to map and send values
                      this.props.navigation.navigate("Map", {
                        handle: "display",
                        time: datetime,
                        latlng: obj.latlng, // latitude and longtitude of drowsiness
                        back: "Profile", // location when press back
                        event: event
                      })
                    }}
                    small
                    style={{ backgroundColor: argonTheme.COLORS.SUCCESS, paddingHorizontal: 0, paddingVertical: 0 }}
                  >
                    Detail
                  </Button>
                </Block>
              </Animated.View>
            )
          })
        }
      </Block >
    )
  };


  render() {
    const { fname, lname, profile, regisdate } = this.state.userInfo
    return (
      <Block flex>
        <Spinner
          visible={this.state.isLoading}
          textStyle={styles.spinnerTextStyle}
        />
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
                datetime = moment(timestamp).format("DD-MM-YYYY HH:MM:ss")
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
                    // this.showModal()
                    this.props.navigation.navigate("EditProfile", {
                      userInfo: this.state.userInfo
                    })
                  }}
                  small
                  style={{ backgroundColor: argonTheme.COLORS.WARNING }}
                >
                  Edit
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
                  Tracking
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
                  <Text bold>Registered date:</Text> {moment(regisdate).format("DD-MM-YYYY HH:MM:ss")}
                </Text>
              </Block>
              <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                <Block style={styles.divider} />
              </Block>
              <Block>
                <Text bold size={28} color="#32325D">
                  Warning Records
                    </Text>
                <Text size={20}>
                  total
                  <Text color={argonTheme.COLORS.WARNING}> {this.state.notificationRecs.length} </Text>
                  record(s)
                </Text>
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
    );
  }
}

const styles = StyleSheet.create({
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
