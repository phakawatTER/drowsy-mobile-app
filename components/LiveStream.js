import React from "react"
import { Block, Text, theme } from "galio-framework";
import { AntDesign } from '@expo/vector-icons';
import { LIVESTREAM_SOCKET_ENDPOINT } from "../link"
import { Video } from "expo-av"
import moment from "moment-timezone"
import {
    Animated,
    StyleSheet,
    Dimensions,
    Image,
    View,
    Modal,
    TouchableHighlight,
    AsyncStorage
} from "react-native";
const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;

class LiveStream extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            modal_opacity: new Animated.Value(0),
            display_livestream: "none",
            vdo_uri: null,
            liveVDO: false,
            isLive: false,
            ear: 0,
            coor: [0, 0],
            gas: { co: 0, lpg: 0, smoke: 0 }
        }
    }
    componentWillMount() {
        this.connectToImageSocket()
    }
    componentWillUnmount() {
        this.s.disconnect()
    }

    componentDidUpdate(prevProps, prevstate) {
        if (JSON.stringify(prevProps.userInfo) !== JSON.stringify(this.props.userInfo)) {  // if user info updated
            this.s.disconnect()
            this.connectToImageSocket()
        }
        if (prevProps.showLive !== this.props.showLive) {
            if (this.props.showLive == true) {
                this.setState({ display_livestream: "" }, () => {
                    this.state.modal_opacity.setValue(0)
                    Animated.timing(
                        this.state.modal_opacity,
                        {
                            toValue: 1,
                            duration: 300
                        }
                    ).start()
                })

            } else {
                Animated.timing(
                    this.state.modal_opacity,
                    {
                        toValue: 0,
                        duration: 300
                    }
                ).start(() => { this.setState({ display_livestream: "none" }) })
            }
        }
    }

    connectToImageSocket = async () => {
        this.s = require("socket.io-client")(LIVESTREAM_SOCKET_ENDPOINT)
        let userInfo = this.props.userInfo
        this.setState({ userInfo })
        let { uid } = userInfo
        this.s.on("connect", () => {
            console.log("connected to ter's socket")
        })
        this.s.on(`live_stream_${uid}`, (data) => {
            let { jpg_text, coor, ear, gas } = data
            let uri = `data:image/jpeg;base64,${jpg_text}`
            try {
                clearTimeout(this.image_timer)
            } catch (err) { }
            try {
                if (!this.state.isLive) {
                    this.props.setIsLive(true)
                    this.setState({ isLive: true })
                }
                this.setState({
                    coor, ear, gas
                })

                this.refs.streamVDO.setNativeProps({
                    source: [{ uri }]
                });
                this.image_timer = setTimeout(() => {
                    this.props.setIsLive(false)
                    this.setState({ isLive: false })
                    this.refs.streamVDO.setNativeProps({
                        source: []
                    });
                }, 2000)
            } catch (err) { }

        })
        this.s.on("disconnect", () => {
            console.log("disconnected from ter's socket")
        })
    }
    render() {
        let { isLive, ear, coor, gas } = this.state
        return (
            <>
                <Animated.View
                    style={{
                        display: this.state.display_livestream,
                        ...styles.dimmer,
                        zIndex: 100,
                        opacity: this.state.modal_opacity
                    }
                    } >
                    {/* CLOSE MODAL BUTTON */}
                    <View style={{ position: "absolute", top: "7.5%", right: "5%" }}>
                        <TouchableHighlight onPress={() => this.props.setShowLive(false)}>
                            <AntDesign
                                name="closecircleo"
                                size={30}
                                color="white"
                            />
                        </TouchableHighlight>
                    </View>

                    {
                        !this.props.vdo_uri ? <Block
                            style={{ width: "100%", height: 300, backgroundColor: "black" }}
                            middle
                            space="evenly">
                            <Image
                                ref={"streamVDO"}
                                style={{ width: "100%", height: "100%" }}
                            />


                            <Block style={{ ...styles.liveLogo, ...{ backgroundColor: isLive ? "crimson" : "grey" } }}>
                                <Text bold color={"white"}>
                                    Live
                          </Text>
                            </Block>
                        </Block>
                            :
                            <>
                                <Block style={styles.vdo_title_block}>
                                    <Text bold color="white" size={24}>
                                        <AntDesign
                                            name="videocamera"
                                            size={22}
                                            color="crimson"
                                        />
                                        {" "}RECORDED VIDEO
                                    </Text>
                                </Block>
                                <Block style={styles.vdo_title_block}>
                                    <Text bold color="white" size={15}>
                                        ACCTIME:{" "}
                                    </Text>
                                    <Text color="white" size={15}>{this.props.trip_acctime}</Text>
                                </Block>
                                <Block style={styles.vdo_title_block}>
                                    <Text bold color="white" size={15}>
                                        DATETIME:{" "}
                                    </Text>
                                    <Text color="white" size={15}>{moment.unix(this.props.trip_acctime).format("DD-MM-YYYY HH:mm:ss")}</Text>
                                </Block>
                                <Video
                                    ref={r => this.vid = r}
                                    source={{ uri: this.props.vdo_uri }}
                                    rate={1.0}
                                    volume={1.0}
                                    muted={false}
                                    resizeMode="cover"
                                    repeat
                                    useNativeControls
                                    shouldPlay
                                    style={{ width: "100%", height: 300 }}
                                />
                            </>
                    }
                    {
                        !this.props.vdo_uri ?
                            <Block style={{ ...styles.info_block }}>
                                <Text bold style={styles.info_text}>Current Data</Text>
                                <Text style={styles.info_text}>EAR: {ear.toFixed(2)}</Text>
                                <Text style={styles.info_text}>Coordinate: ({coor[0].toFixed(2)},{coor[1].toFixed(2)})</Text>
                                {
                                    Object.keys(gas).map(key => {
                                        return (
                                            <Text style={styles.info_text}>{key.toUpperCase()}: {gas[key].toFixed(2)} ppm</Text>
                                        )
                                    })
                                }
                            </Block>
                            : null
                    }
                </Animated.View >
            </>
        )
    }
}

const styles = StyleSheet.create({
    vdo_title_block: {
        padding: 10,
        flexDirection: "row",
        width: "100%"
    },
    backButton: {
        display: "flex",
        backgroundColor: "transparent",

    },
    info_block: {
        alignSelf: "baseline",
        padding: 10,
        width: "100%"
    },

    info_text: { color: "white" },
    liveLogo: {
        backgroundColor: "crimson",
        position: "absolute",
        top: 10,
        left: 2.5,
        padding: 5,
        borderRadius: 2.5
    },
    dimmer: {
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.9)",
        minWidth: width,
        minHeight: height,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
})
export default LiveStream;