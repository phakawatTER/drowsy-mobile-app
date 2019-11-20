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

    fetchAllTrips = () => {
        let tripRef = this.databaseRef.child(`usertrips/${this.state.userInfo.uid}`)
        tripRef.once("value", snapshot => {
            let acctimes = []
            let alltrips = snapshot.val()
            console.log("trips",alltrips)
            Object.keys(alltrips).map(key => {
                let acctime = alltrips[key].acctime
                acctimes.push(acctime)
            })
            this.setState({ alltrips: acctimes }, () => {
                // alert("FUCK")
                console.log(this.state)
            })
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
                Object.keys(response.data.tripdata).map((key, index) => {
                    // console.log(index)
                    let latitude = response.data.tripdata[key].latlng[0] + 1 * index
                    let longitude = response.data.tripdata[key].latlng[1]
                    triplineCoordinates.push({
                        latitude: latitude,
                        longitude: longitude
                    })
                })
                this.setState({ tripData: triplineCoordinates }, () => {
                    console.log(this.state.tripData)
                    this.mapFitToCoordinates()
                })
            }
        }).catch(err => {
            this.setState({ isLoading: false })

            console.log(err)
        })
    }

    mapFitToCoordinates = () => {
        console.log(this.state.tripData)
        this.mapRef.current.fitToCoordinates(this.state.tripData, { animated: true })
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
                this.fetchTripData()
            } else {
                this.toastRef.current.show(`No trip matched in that interval`, 1500);
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
                    <TouchableOpacity>
                        <Block
                            style={{ backgroundColor: "rgba(0,0,0,0.8)", height: height, width: width }}
                        >
                            <Block style={{ marginTop: "50%" }}>
                                <Block middle>
                                    <Text h4 color={"white"} bold>SELECT {handle.toUpperCase()} DATE</Text>
                                </Block>
                                <DatePickerIOS
                                    mode={"date"}
                                    style={{ padding: theme.SIZES.BASE }}
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
                    </TouchableOpacity>
                </Modal>
            )
        }
        const TripPicker = () => {
            if (this.state.intersectDate.length > 0) {
                // console.log(this.state.selectedDate)
                return (
                    <Block style={{ padding: theme.SIZES.BASE }} >
                        <Picker
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
            if (this.state.tripData.length > 0) {
                console.log(this.state.tripData[index])
                return (
                    <MapView.Marker
                        coordinate={this.state.tripData[index]}
                    />
                )
            }
        }
        return (
            <Block flex style={{ ...styles.container }}>
                <Spinner
                    visible={this.state.isLoading}
                />
                <Toast
                    ref={this.toastRef}
                    defaultCloseDelay={1000}
                    style={{ backgroundColor: argonTheme.COLORS.ERROR }}
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
                    {
                        this.state.tripData.length !== 0 ?
                            <MapView.Polyline
                                coordinates={this.state.tripData}
                                strokeWidth={6}
                            />
                            : null
                    }


                    {renderMarker(0)}
                    {renderMarker(this.state.tripData.length - 1)}
                </MapView>
            </Block>
        )
    }
}

const styles = StyleSheet.create({
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