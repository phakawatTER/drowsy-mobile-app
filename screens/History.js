import React from "react"
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
    TouchableOpacity,
    DatePickerIOS,

} from "react-native";
import { Picker } from "react-native-picker-dropdown"
import Spinner from "react-native-loading-spinner-overlay"
import { Block, Text, theme } from "galio-framework";
import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import { API_GET_TRIPDATA, API_GET_ALL_TRIPS } from "../link"
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"
import { Audio } from 'expo-av';
import Toast, { DURATION } from 'react-native-easy-toast'
import MapView from "react-native-maps";
import Theme from "../constants/Theme";
const { height, width } = Dimensions.get('screen');
class History extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            tripData: [],
            selectedDate: null,
            alltrips: [],
            startdate: new Date(),
            stopdate: new Date(),
            showDatepicker: false,
            handle: "start",
            userInfo: this.props.screenProps.getUserInfo(),
            intersectDate: []
        }
        try {
            firebase.initializeApp(config)
        } catch (err) { }
        this.mapRef = React.createRef()
        this.toastRef = React.createRef()
        this.databaseRef = firebase.database().ref()

    }

    componentDidMount() {
        this.focusListener = this.props.navigation.addListener("didFocus", () => {
            this.fetchAllTrips()
        })
    }

    // newTripListener = () => {
    //     let tripRef = this.databaseRef.child(`usertrips/${this.state.userInfo.uid}`)
    //     tripRef.on("child_added", snapshot => {
    //         let { alltrips } = this.state
    //         alltrips.push(snapshot)
    //         this.setState({ alltrips })
    //     })
    // }

    fetchAllTrips = () => {
        let tripRef = this.databaseRef.child(`usertrips/${this.state.userInfo.uid}`)
        tripRef.once("value", snapshot => {
            let acctimes = []
            let alltrips = snapshot.val()
            try {
                Object.keys(alltrips).map(key => {
                    let acctime = alltrips[key].acctime
                    acctimes.push(acctime)
                })
                this.setState({ alltrips: acctimes }, () => {
                })
            } catch (err) { }

        })
    }

    toggleDatePicker = (handle) => {
        this.setState({ showDatepicker: !this.state.showDatepicker, handle })
    }

    fetchTripData = () => {
        this.setState({ isLoading: true })
        let { userInfo } = this.state
        let { token, uid } = userInfo
        let payload = {
            uid: uid,
            from: "app",
            acctime: this.state.selectedDate
        }
        axios.create({
            headers: { "Content-Type": "application/json", token: token }
        }).post(API_GET_TRIPDATA, payload).then(response => {
            let code = response.data.code
            if (code === 200) {
                this.setState({ isLoading: false })
                let triplineCoordinates = []
                try {
                    Object.keys(response.data.tripdata).map((key, index) => {
                        // console.log(index)
                        let latitude = response.data.tripdata[key].latlng[0]
                        let longitude = response.data.tripdata[key].latlng[1]
                        let speed = response.data.tripdata[key].speed
                        triplineCoordinates.push({
                            latitude: latitude,
                            longitude: longitude,
                            speed
                        })
                    })
                    this.setState({ tripData: triplineCoordinates }, () => {
                        this.mapFitToCoordinates()
                    })
                } catch (err) { }
            }
        }).catch(err => {
            this.setState({ isLoading: false })

            console.log(err)
        })
    }

    mapFitToCoordinates = () => {
        this.mapRef.current.fitToCoordinates(this.state.tripData, {
            animated: true,
            edgePadding: {
                top: 70,
                bottom: 70,
                right: 70,
                left: 70,
            }
        })
    }

    searchTrips = () => {
        let { alltrips, startdate, stopdate } = this.state
        startdate = moment(startdate).format("YYYY-MM-DD")
        stopdate = moment(stopdate).format("YYYY-MM-DD")
        let inBetween = alltrips.filter(date => {
            date = moment.unix(date).format("YYYY-MM-DD HH:MM:ss").toString()
            return moment(date.split(" ")[0]).isBetween(startdate, stopdate, null, "[]")
        })
        this.setState({ intersectDate: inBetween, selectedDate: inBetween.length == 0 ? null : inBetween[0], tripData: [] }, () => {
            if (inBetween.length > 0) {
                // this.fetchTripData()
                this.setState({ toastBG: argonTheme.COLORS.SUCCESS }, () => {
                    this.toastRef.current.show(`${inBetween.length} trip(s) found in this interval`, 1500);
                })
            } else {
                this.setState({ toastBG: argonTheme.COLORS.ERROR }, () => {
                    this.toastRef.current.show(`No trip found in this interval`, 1500);
                })
            }
        })
    }

    dateChangeHandler = (evt, handle) => {
        // console.log(evt)
        switch (handle) {
            case "start":
                return this.setState({ startdate: evt });
            case "stop":
                let isAfter = moment(evt).isAfter(moment(this.state.startdate))
                if (!isAfter) return this.setState({ startdate: evt, stopdate: evt })
                return this.setState({ stopdate: evt });
        }
    }

    render() {

        const DatepickerModalIOS = () => {
            const { showDatepicker, handle } = this.state
            return (
                <Modal
                    style={{ ...styles.datepickerModal }}
                    visible={showDatepicker}
                    transparent
                    animated
                >
                    <Block
                        style={{ backgroundColor: "rgba(255,255,255,0.90)", height, width }}
                    >
                        <Block style={{ marginTop: "50%" }}>
                            <Block middle>
                                <Text h4 bold>SELECT {handle.toUpperCase()} DATE</Text>
                            </Block>
                            <DatePickerIOS
                                mode={"date"}
                                // style={{ padding: theme.SIZES.BASE, color: "white" }}
                                date={handle == "start" ? this.state.startdate : this.state.stopdate}
                                onDateChange={(evt) => { this.dateChangeHandler(evt, handle) }}
                                maximumDate={new Date()}
                            >
                            </DatePickerIOS>
                            <Block middle>
                                <Button
                                    onPress={() => {
                                        this.toggleDatePicker(handle)
                                    }}
                                    style={{ backgroundColor: argonTheme.COLORS.SUCCESS, paddingHorizontal: 0, paddingVertical: 0 }}
                                >

                                    Confirm
                                    </Button>
                            </Block>
                        </Block>

                    </Block>

                    {/* </Block> */}
                </Modal>
            )
        }
        const TripPicker = () => {
            if (this.state.intersectDate.length > 0) {
                // console.log(this.state.selectedDate)
                return (
                    <Block style={{ padding: theme.SIZES.BASE }} >
                        <Text bold>
                            Select a trip
                        </Text>
                        <Picker
                            style={{ padding: 5 }}
                            selectedValue={this.state.selectedDate}
                            onValueChange={
                                (itemValue, itemIndex) => {
                                    this.setState({ selectedDate: itemValue }, () => {
                                        this.fetchTripData()
                                    })
                                }
                            }
                            color={"black"}
                        >
                            {
                                this.state.intersectDate.map((date, index) => {
                                    let label = "Trip: " + moment.unix(date).format("YYYY-MM-DD HH:mm:ss").toString()
                                    return (
                                        <Picker.Item label={label} value={date} key={`date-option-${index}`} />
                                    )
                                })
                            }
                        </Picker>
                    </Block>
                )
            }
        }
        const renderMarker = (index) => {
            let { tripData } = this.state
            let length = tripData.length
            // let currentPoint = tripData[index]
            if (this.state.tripData.length > 0) {
                return (
                    <MapView.Marker
                        coordinate={this.state.tripData[index]}
                        title={index === 0 ? "Trip start" : index === length - 1 ? "Trip stop" : null}
                        description={`Date time: 21-11-2019 06:39:43 pm`}
                    >
                        {
                            index === 0 ?
                                <Image source={Images.start} style={{ ...styles.markerStyle }} />

                                : index === length - 1 ?
                                    <Image source={Images.stop} style={{ ...styles.markerStyle, ...styles.stopMarker }} />
                                    : null
                        }
                    </MapView.Marker>
                )
            }
        }
        const renderTripline = () => {
            let { tripData } = this.state
            return (
                tripData.map((data, index) => {
                    let current = data
                    let coor = [current]
                    let speed = current.speed
                    let next = null
                    if (index + 1 <= tripData.length - 1) {
                        next = tripData[index + 1]
                        speed = next.speed
                        coor.push(next)
                    }
                    console.log(coor)
                    return (
                        <MapView.Polyline
                            key={`polyline-${index}`}
                            coordinates={coor}
                            strokeWidth={6}
                            strokeColor={
                                speed <= 50 ?
                                    "green"
                                    : speed > 50 && speed <= 80 ?
                                        "orange"
                                        : speed > 80 ?
                                            "red"
                                            : null
                            }
                        />
                    )
                }))
        }


        return (
            <Block flex style={{ ...styles.container }}>
                <Spinner
                    visible={this.state.isLoading}
                />
                <Toast
                    ref={this.toastRef}
                    defaultCloseDelay={1000}
                    style={{ backgroundColor: this.state.toastBG }}
                    position={"top"}
                    positionValue={20}
                    opacity={0.9}
                />
                {DatepickerModalIOS()}
                <Block style={{ ...styles.datepickerContainer }}>
                    <Block style={{ ...styles.datepicker }} middle>
                        <TouchableOpacity onPress={() => this.toggleDatePicker("start")}>
                            <Text color={argonTheme.COLORS}>
                                <Text bold>
                                    Start Date:{" "}
                                </Text>
                                {moment(this.state.startdate).format("DD-MM-YYYY").toString()}
                            </Text>
                        </TouchableOpacity>
                        <Text>{" "}</Text>
                        <TouchableOpacity onPress={() => this.toggleDatePicker("stop")}>
                            <Text color={argonTheme.COLORS}>
                                <Text bold>
                                    Stop Date:{" "}
                                </Text>
                                {moment(this.state.stopdate).format("DD-MM-YYYY").toString()}
                            </Text>
                        </TouchableOpacity>
                        <Text>{" "}</Text>
                        <Button onPress={this.searchTrips} small style={{ backgroundColor: argonTheme.COLORS.SUCCESS }}>
                            Search
                        </Button>
                    </Block>
                    {TripPicker()}
                </Block>
                <MapView
                    ref={this.mapRef}
                    style={{ ...styles.mapStyle }}
                >
                    {renderTripline()}
                    {/* RENDER START MARKER */}
                    {renderMarker(0)}
                    {/* RENDER STOP MARKER */}
                    {renderMarker(this.state.tripData.length - 1)}
                </MapView>
            </Block>
        )
    }
}

const styles = StyleSheet.create({
    markerStyle: {
        width: 52.5,
        height: 45,
    },
    stopMarker: {
        marginTop: -25,
        marginLeft: 40
    },
    datepickerModal: {
        backgroundColor: "black",
        opacity: 0,
        height: 0.5 * height
    },
    datepicker: {
        padding: theme.SIZES.BASE,
        flexDirection: "row"
    },
    datepickerContainer: {
        backgroundColor: "#FFFFFF"
    },
    topInfo: {
        paddingVertical: "10%",
        // color: "white"
    },
    mapHeader: {
        maxHeight: 0.1 * height,
        height: 0.1 * height,
    },
    mapStyle: {
        height: 0.825 * height,
        width: width
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
    container: {
        backgroundColor: argonTheme.COLORS.DEFAULT,
        marginTop: Platform.OS === 'android' ? -HeaderHeight : 0,
    },
    padded: {
        paddingHorizontal: theme.SIZES.BASE * 2,
        zIndex: 3,
        position: 'absolute',
        bottom: Platform.OS === 'android' ? theme.SIZES.BASE * 2 : theme.SIZES.BASE * 3,
    },
    button: {
        width: width,
        height: 0.1 * height,
        shadowRadius: 0,
        shadowOpacity: 0,
    },
    pro: {
        backgroundColor: argonTheme.COLORS.INFO,
        paddingHorizontal: 8,
        marginLeft: 3,
        borderRadius: 4,
        height: 22,
        marginTop: 15
    },
    gradient: {
        zIndex: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 66,
    },
});
export default History;