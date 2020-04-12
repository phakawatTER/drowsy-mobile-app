import React from "react"
import { Block, Text, theme } from "galio-framework";
import { AntDesign } from '@expo/vector-icons';
import { LIVESTREAM_SOCKET_ENDPOINT } from "../link"
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
import { TouchableOpacity } from "react-native-gesture-handler";
const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;

class LiveStream extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            modal_opacity: new Animated.Value(0),
            display_livestream: "none",
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

    showLiveStream = (liveVDO) => {
        this.setState({ liveVDO })
    }
    connectToImageSocket = async () => {
        this.s = require("socket.io-client")(LIVESTREAM_SOCKET_ENDPOINT)
        let userInfo = await AsyncStorage.getItem("userInfo")
        userInfo = JSON.parse(userInfo)
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
        console.log(this.props.showLive)
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
                    <View style={{ position: "absolute", top: "7.5%", right: "5%" }}>
                        <TouchableHighlight onPress={() => this.props.setShowLive(false)}>
                            <AntDesign
                                name="closecircleo"
                                size={30}
                                color="white"
                            />
                        </TouchableHighlight>
                    </View>

                    <Block
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
                </Animated.View >
            </>
        )
    }
}

const styles = StyleSheet.create({
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