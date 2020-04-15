import React from "react";
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
import { backgroundColor } from "../constants/colors"
// import {colors} from
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import { API_GET_NOTIFICATION_RECORD } from "../link"
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"
import { PieChart } from 'react-native-svg-charts'
import 'react-native-svg';
const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;
var listWidth = 0

class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            eventGroup: {},
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
        let { uid } = this.state.userInfo
        let notificationRef = firebase
            .database().ref()
            .child("notification").child(uid).limitToLast(1)
        notificationRef.off("child_added") // turn off notification on when unmount
    }

    searchEvent = (query) => {
        this.setState({ searchQuery: query })

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
                        let eventGroup = {}
                        result.map((data, index) => {
                            let { event } = data
                            if (!(event in eventGroup)) eventGroup[event] = 1
                            else eventGroup[event] += 1
                        })
                        this.setState({
                            eventGroup,
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
                                    let eventGroup = {}
                                    this.state.notificationRecs.map((data, index) => {
                                        let { event } = data
                                        if (!(event in eventGroup)) eventGroup[event] = 1
                                        else eventGroup[event] += 1
                                    })
                                    this.setState({
                                        eventGroup,
                                        notificationRecs: this.state.notificationRecs,
                                        modalVisible: true
                                    }, () => {
                                        // show toast
                                        let { timestamp, event } = snapshot.val()
                                        timestamp = moment(timestamp).format("DD-MM-YYYY HH:MM:ss a")
                                    })

                                }
                            })
                        })
                    } else {
                    }
                }).catch(err => {
                    this.setState({ isLoading: false })
                    console.log(err)
                })
        }).catch(err => {
            this.setState({ isLoading: false })
        })
    }

    getPieData = (eventGroup) => {
        let pieData = Object.keys(eventGroup).map((key, index) => {
            return ({
                value: eventGroup[key],
                svg: {
                    fill: backgroundColor[index]
                },
                key: `pie-${key}`
            })
        })
        return pieData


    }

    getTodayRecord = () => {
        let { notificationRecs } = this.state
        let currentTIME = moment(new Date()).format("YYYY-MM-DD").toString()
        let todayRecs = notificationRecs.filter(data => {
            let timestamp = moment(data.timestamp).format("YYYY-MM-DD").toString()
            return moment(timestamp).isBetween(currentTIME, currentTIME, null, "[]")
        })

        return todayRecs

    }

    getTodayEventGroup = (todayRecs) => {
        let eventGroup = {}
        todayRecs.map((data, index) => {
            let { event } = data
            if (!(event in eventGroup)) eventGroup[event] = 1
            else eventGroup[event] += 1
        })
        // alert(JSON.stringify(eventGroup))
        return eventGroup

    }

    render() {
        const todayRecs = this.getTodayRecord()
        const todayEventGroup = this.getTodayEventGroup(todayRecs)
        const { eventGroup } = this.state
        const renderPieChart = (eventGroup) => {
            let data = this.getPieData(eventGroup)
            return (
                <PieChart
                    data={data}
                    style={{ ...styles.pieChart }}
                />
            )
        }

        const renderPieChartList = (eventGroup) => {
            return (this.state.eventGroup.length !== 0 ?
                Object.keys(eventGroup).map((key, index) => {
                    // alert(this.state.eventGroup[)
                    return (
                        <Block row style={{ paddingVertical: 5 }}>
                            <Block style={{ borderRadius: 10, width: 20, height: 20, backgroundColor: backgroundColor[index] }} />
                            <Text bold> {key}</Text>
                            <Text> {eventGroup[key]}</Text>
                        </Block>
                    )
                })
                : null)
        }

        return (
            <Block flex >
                <Spinner
                    visible={this.state.isLoading}
                    textStyle={styles.spinnerTextStyle}
                />
                <ScrollView
                    vertical={true}
                    showsVerticalScrollIndicator={false}
                    style={{
                        width,
                    }}
                >
                    <Block flex style={{ ...styles.profileCard }}>
                        <Block flex>

                            <Block>
                                <Text bold size={28} color="#32325D">All Time Records</Text>

                                <Text size={20}>
                                    total<Text color={argonTheme.COLORS.WARNING}> {this.state.notificationRecs.length} </Text>
                                    record(s)
                        </Text>
                                {/* GRAPH WILL BE PUT HERE */}
                                <Block >
                                    {renderPieChart(eventGroup)}
                                    <Block flex>
                                        {renderPieChartList(eventGroup)}
                                    </Block>

                                </Block>


                            </Block>
                            <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                                <Block style={styles.divider} />
                            </Block>
                        </Block>
                    </Block>

                    {
                        Object.keys(todayEventGroup).length !== 0 ?
                            <Block flex style={{ ...styles.profileCard }}>
                                <Block flex>

                                    <Block>
                                        <Text bold size={28} color="#32325D">Today Records</Text>

                                        <Text size={20}>
                                            total<Text color={argonTheme.COLORS.WARNING}> {todayRecs.length} </Text>
                                            record(s)
                        </Text>
                                        {/* GRAPH WILL BE PUT HERE */}
                                        <Block >
                                            {renderPieChart(todayEventGroup)}
                                            <Block flex>
                                                {renderPieChartList(todayEventGroup)}
                                            </Block>

                                        </Block>


                                    </Block>
                                    <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                                        <Block style={styles.divider} />
                                    </Block>
                                </Block>
                            </Block>
                            : null
                    }

                </ScrollView>
            </Block >
        );
    }
}

const styles = StyleSheet.create({
    pieChart: {
        height: 200
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
        marginTop: 20,
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
