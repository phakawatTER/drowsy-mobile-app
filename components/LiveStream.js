import React from "react"
import { Block, Text, theme } from "galio-framework";
import { SOCKET_ENDPOINT } from "../link"
import {
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
var listWidth = 0

class LiveStream extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
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

    showLiveStream = (liveVDO) => {
        this.setState({ liveVDO })
    }
    connectToImageSocket = async () => {
        this.s = require("socket.io-client")(SOCKET_ENDPOINT)
        let userInfo = await AsyncStorage.getItem("userInfo")
        userInfo = JSON.parse(userInfo)
        this.setState({ userInfo })
        let { uid } = userInfo
        this.s.on("connect", () => {
            console.log("connected to ter's socket")
        })
        this.s.on(`image_${uid}`, (data) => {
            let { jpg_text, coor, ear, gas } = data
            console.log(ear, coor, gas)
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
        let { liveVDO, isLive, ear, coor, gas } = this.state
        return (
            <Modal
                visible={liveVDO}
                transparent={true}
                animated={"fade"}
            >
                <TouchableHighlight
                    onPress={() => this.setState({ liveVDO: false})}
                >
                    <View style={{ ...styles.dimmer, backgroundColor: "rgba(0,0,0,0.9)" }} >
                        <Block
                            style={{ width: "100%", height: 300, backgroundColor: "black", position: "relative" }}
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
                    </View>
                </TouchableHighlight>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    info_block: {
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
        backgroundColor: "rgba(0,0,0,0.5)",
        minWidth: width,
        minHeight: height,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
})
export default LiveStream;