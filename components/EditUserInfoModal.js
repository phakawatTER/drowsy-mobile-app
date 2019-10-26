import React from "react"
// import Modal from "react-native"
import {
    Modal,
    TouchableHighlight,
    View,
    Alert,
    StyleSheet,
    Dimensions,

} from 'react-native';

import { Block, Text, theme } from "galio-framework";
import { Button } from "./Button";
// import { Table, Row, Rows } from 'react-native-table-component';
import { Images, argonTheme } from "../constants";
import { HeaderHeight } from "../constants/utils";
import { AsyncStorage } from "react-native";
import axios from "axios"
import moment from "moment"
import firebase from "firebase"
import { config } from "../firebase-config"

const { width, height } = Dimensions.get("screen");
const thumbMeasure = (width - 48 - 32) / 3;

class EditUserInfoModal extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            modalVisible: false
        }
    }
    setModalVisible(visible) {
        this.setState({ modalVisible: visible });
    }

    render() {
        return (
            <Modal
                style={{ ...styles.modalBackground }}
                animationType="fade"
                transparent={true}
                visible={this.state.modalVisible}
                onRequestClose={() => {
                    Alert.alert('Modal has been closed.');
                }}>
                <TouchableHighlight onPress={(e) => {
                    e.stopPropagation()
                    this.setModalVisible(false)
                }}>
                    <View style={{ ...styles.dimmer }} >
                        <Block style={styles.info}>
                            <Block flex>
                                <Block middle style={styles.nameInfo}>
                                    <Text bold size={28} color="#32325D">
                                        {/* {fname} {lname} */}
                                    </Text>
                                </Block>
                                <Block middle style={{ ...styles.modalContent }}>
                                    
                                </Block>
                            </Block>
                        </Block>
                    </View>
                </TouchableHighlight>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    modalContent: {
        borderRadius: 10,
        marginTop: 30,
        marginBottom: 16,
        width: 0.95 * width,
        // height: 0.8 * height,
        backgroundColor: "white"
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
    modalBackground: {
        backgroundColor: "rgba(0,0,0,0.5)"
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
        borderWidth: 4,
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


export default EditUserInfoModal