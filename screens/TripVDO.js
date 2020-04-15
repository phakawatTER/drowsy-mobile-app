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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video } from "expo-av"
import Spinner from "react-native-loading-spinner-overlay"
import { Block, Text, theme } from "galio-framework";
import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import * as FileSystem from 'expo-file-system';
import { backgroundColor } from "../constants/colors"
// import {colors} from
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import { API_GET_VDO_LIST, API_GET_VDOSTREAM } from "../link"
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"
import Toast, { DURATION } from 'react-native-easy-toast'
import { PieChart } from 'react-native-svg-charts'
import 'react-native-svg';
const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;
var listWidth = 0

class Profile extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            isLoading: true,
            vdo_list: [],
            video_file_uri: {},
            current_uri: "",
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

    getVDOList = () => {
        this.setState({ isLoading: true })
        let { uid } = this.props.screenProps.getUserInfo()
        axios.post(API_GET_VDO_LIST, {
            uid
        }).then(response => {
            let { code, vdo } = response.data
            if (code === 200) {
                return this.setState({
                    vdo_list: vdo,
                    isLoading: false,
                })
            }
            return this.setState({ vdo_list: [], isLoading: false })
        }).catch(err => {
            console.log(err)
            return this.setState({ isLoading: false })
        })
    }

    componentWillMount() {
        let { navigation } = this.props
        this.loadUserInfo()
        this.focusListener = navigation.addListener('didFocus', () => {
            this.getVDOList()
        });
    }

    componentWillReceiveProps(nextProps) {
        let headerHeight = nextProps.navigation.getParam("headerHeight")
    }


    selectVDO = async (file) => {
        this.setState({ isLoading: true })
        if (!Object.keys(this.state.video_file_uri).includes(file)) { // if the file is not download and cached
            let { uid } = this.props.screenProps.getUserInfo()
            const downloadResumable = FileSystem.createDownloadResumable(
                API_GET_VDOSTREAM,
                FileSystem.documentDirectory + file,
                {
                    headers: {
                        uid, file
                    }
                },
            );
            try {
                const { uri: current_uri } = await downloadResumable.downloadAsync();
                console.log('Finished downloading to ', current_uri);
                this.state.video_file_uri[file] = current_uri
                this.setState({ current_uri, video_file_uri: this.state.video_file_uri, isLoading: false })
                this.props.screenProps.setShowLive(true, current_uri)

            } catch (e) {
                this.setState({ isLoading: false })
                console.error(e);
            }
        } else {
            let current_uri = this.state.video_file_uri[file]
            this.setState({ current_uri, isLoading: false })
            this.props.screenProps.setShowLive(true, current_uri)

        }
    }


    render() {
        let { vdo_list } = this.state

        const renderTripVDOList = () => {

            return (
                <FlatList
                    data={vdo_list}
                    renderItem={({ item }) => {
                        if (vdo_list.length == 0) return (<></>)
                        return (
                            <Animated.View
                                style={{
                                    marginLeft: 0,
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    borderRadius: 5,
                                }}
                            >
                                <Block
                                    left
                                    space="evenly"
                                    style={{
                                        paddingVertical: 10,
                                    }}
                                >
                                    <Block
                                        left
                                        row
                                        space="evenly"
                                        style={{ width: "100%" }}
                                    >
                                        <Block style={{ flexDirection: "row" }}>
                                            <Text style={{ color: "#000" }} bold>
                                                Trip Acctime {" "}
                                            </Text>
                                            <Text>{item.split(".")[0]}</Text>
                                        </Block>
                                        <Block space="evenly" middle>
                                            <Button
                                                onPress={() => this.selectVDO(item)}
                                                small
                                                style={{ backgroundColor: argonTheme.COLORS.SUCCESS, paddingHorizontal: 0, paddingVertical: 0 }}
                                            >
                                                <Text color={"white"} bold>
                                                    <MaterialCommunityIcons
                                                        name="map-marker-radius"
                                                        size={12}
                                                        color="white"
                                                    />
                                                    {" "}
                                      View
                                    </Text>
                                            </Button>
                                        </Block>
                                    </Block>
                                </Block>
                                <Block style={styles.divider} />
                            </Animated.View>
                        )
                    }}
                />
            )
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
                            {/* {
                                this.state.current_uri ?
                                    <Video
                                        ref={r => this.vid = r}
                                        source={{ uri: this.state.current_uri }}
                                        rate={1.0}
                                        volume={1.0}
                                        muted={false}
                                        resizeMode="cover"
                                        repeat
                                        useNativeControls
                                        style={{ width: "100%", height: 300 }}
                                    />
                                    : null
                            } */}
                            <Block>
                                <Text bold size={28} color="#32325D">Trip VDO</Text>

                                <Text size={20}>
                                    total<Text color={argonTheme.COLORS.WARNING}>
                                        {this.state.vdo_list.length}
                                    </Text>
                                    record(s)
                            </Text>
                                {renderTripVDOList()}

                            </Block>
                            {/* <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                                <Block style={styles.divider} />
                            </Block> */}
                        </Block>
                    </Block>

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
