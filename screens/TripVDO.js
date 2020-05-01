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
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
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
            listIndex: 0,
            pages: [],
            headerHeight: 0,
            isLoading: true,
            vdo_list: [],
            video_file_uri: {},
            current_uri: "",
            vdo_download_progress: 0,
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


    arrangePage = (data) => {
        let pageSize = 15
        let count = 0
        let pages = []
        while (data.length > 0) {
            page = data.slice(0, pageSize)
            pages.push(page)
            data = data.slice(page.length, data.length)
        }
        return pages
    }

    getVDOList = () => {
        this.setState({ isLoading: true })
        let { uid } = this.props.screenProps.getUserInfo()
        axios.post(API_GET_VDO_LIST, {
            uid
        }).then(response => {
            let { code, vdo } = response.data
            if (code === 200) {
                let pages = this.arrangePage(vdo)
                return this.setState({
                    pages,
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
        let userInfo = this.props.screenProps.getUserInfo()
        let { uid } = userInfo
        let acctime = file.split(".")[0]
        this.setState({ isLoading: true })
        if (!Object.keys(this.state.video_file_uri).includes(file)) { // if the file is not download and cached
            let { uid } = this.props.screenProps.getUserInfo()
            const downloadResumable = FileSystem.createDownloadResumable(
                `${API_GET_VDOSTREAM}/${uid}/${file}`,
                FileSystem.documentDirectory + file,
                {},
                (snapshot) => {
                    let { totalBytesWritten, totalBytesExpectedToWrite } = snapshot
                    let vdo_download_progress = (totalBytesWritten / totalBytesExpectedToWrite) * 100
                    console.log(vdo_download_progress, "%")
                    this.setState({ vdo_download_progress })
                }
            );
            try {
                let current_uri = `${API_GET_VDOSTREAM}/${uid}/${file}`
                this.state.video_file_uri[file] = current_uri
                this.setState({ current_uri, video_file_uri: this.state.video_file_uri, isLoading: false })
                this.props.screenProps.setShowLive(true, current_uri, acctime)
                // downloadResumable.downloadAsync().then(data => {
                //     console.log("this is data", data)
                //     let { uri: current_uri } = data
                // this.state.video_file_uri[file] = current_uri
                // this.setState({ current_uri, video_file_uri: this.state.video_file_uri, isLoading: false })
                // this.props.screenProps.setShowLive(true, current_uri, acctime)
                // });
            } catch (e) {
                this.setState({ isLoading: false })
                console.error(e);
            }
        } else {
            let current_uri = this.state.video_file_uri[file]
            this.setState({ current_uri, isLoading: false })
            this.props.screenProps.setShowLive(true, current_uri, acctime)

        }
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


    render() {
        let { vdo_list, isLoading, pages } = this.state

        const renderItem = (items) => {
            return (
                <Block style={{ width: listWidth }}>
                    {items.map(item => {
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
                                            <Text style={{ color: "#000" }}>
                                                <Text bold>Trip Acctime</Text> {item.split(".")[0]}
                                                {"\n"}
                                                <Text bold>Datetime</Text> {moment.unix(item.split(".")[0]).format("DD-MM-YYYY HH:mm:ss")}
                                            </Text>
                                        </Block>

                                        <Block space="evenly" middle>
                                            <Button
                                                onPress={() => this.selectVDO(item)}
                                                small
                                                style={{ backgroundColor: argonTheme.COLORS.SUCCESS, paddingHorizontal: 0, paddingVertical: 0 }}
                                            >
                                                <Text color={"white"} bold>
                                                    <AntDesign
                                                        name="videocamera"
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
                    })}</Block>)

        }
        const renderTripVDOList = () => {
            if (vdo_list.length == 0 && !isLoading) {
                return (
                    <>
                        <Block>
                            <Text
                                bold
                                color="#32325D"
                                style={{ textAlign: "center" }}
                                size={48}
                            >
                                No Video Records Found!
                            </Text>
                        </Block>
                    </>
                )
            } else {

                return (
                    <>
                        <FlatList
                            pagingEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={this.onScrollEnd}
                            horizontal
                            data={pages}
                            renderItem={({ item }) => renderItem(item)}
                        >

                        </FlatList>
                        <Block middle style={{ flexDirection: "row", paddingTop: 25 }}>
                            {
                                pages.map((el, index) => {
                                    return (
                                        <View style={{ ...styles.pagination, ...index === this.state.listIndex ? styles.activeDotStyle : styles.dotStyle }}></View>
                                    )
                                })
                            }
                        </Block>
                    </>
                )
            }
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
                    style={{ width }}
                >
                    <Block flex style={{
                        ...styles.profileCard
                    }}>
                        <Block flex>
                            <Block
                                onLayout={(event) => {
                                    var { x, y, width, height } = event.nativeEvent.layout;
                                    listWidth = width
                                }}
                            >
                                <Text bold size={28} color="#32325D">Trip Video</Text>
                                <Text size={20}>
                                    total{" "}<Text color={argonTheme.COLORS.WARNING}>
                                        {this.state.vdo_list.length}
                                    </Text>{" "}
                                    video(s)
                            </Text>
                                {renderTripVDOList()}
                            </Block>
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
