import React from "react";
import {
    ScrollView,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    TouchableHighlight,
    Image,
    Platform
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import Spinner from "react-native-loading-spinner-overlay"
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions'
const { width, height } = Dimensions.get("screen");
const imagePickerOptions = {
    mediaTypes: "Images",
    quality: 1,
    aspect: [1, 1]
}
class EditProfile extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            fname: "",
            lname: "",
            email: "",
            profile: ""
        }

    }

    getUserInfo = () => {
        let {
            profile,
            email,
            fname,
            lname
        } = this.props.navigation.getParam("userInfo")
        this.setState({ email, fname, lname, profile })
    }

    componentDidMount() {
        this.getUserInfo()
    }

    getPermissionAsync = async () => {
        if (Platform.OS === "ios") {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
            }
        }
    }

    pickImage = async () => {
        let image = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "Images",
            allowsEditing: true,
            aspect: [4, 3],
        })
        console.log(image)
        let { uri } = image
        this.setState({ profile: uri })
    }

    render() {
        let {
            profile,
            email,
            fname,
            lname
        } = this.state
        console.log(profile)
        return (
            <Block flex middle>
                <Spinner
                    visible={this.state.isLoading}
                    textStyle={styles.spinnerTextStyle}
                />
                <Block flex style={styles.registerContainer}>
                    <ScrollView vertical>
                        <Block middle>
                            <Text bold size={28} color="#32325D">
                                Your Info
                                    </Text>
                        </Block>
                        <Block style={{ ...styles.profileUploader }}>
                            <Block middle style={styles.avatarContainer}>
                                <TouchableHighlight onPress={() => { this.pickImage() }} underlayColor={"rgba(0,0,0,0)"}>
                                    <Image
                                        onLoad={() => { this.setState({ isLoading: false }) }}
                                        source={profile ? { uri: profile } : Images.defaultAvatar}
                                        style={styles.avatar}
                                    />
                                </TouchableHighlight>
                            </Block>
                        </Block>
                        <Block>
                            <Input
                                editable={false}
                                value={email}
                                onChangeText={(text) => this.onChangeHandler("email", text)}
                                family="ArgonExtra"
                                style={styles.inputIcons}
                            />
                        </Block>
                        <Block>
                            <Input
                                editable={false}
                                value={fname}
                                onChangeText={(text) => this.onChangeHandler("fname", text)}
                                family="ArgonExtra"
                                style={styles.inputIcons}
                            />
                        </Block>
                        <Block>
                            <Input
                                editable={false}
                                value={lname}
                                onChangeText={(text) => this.onChangeHandler("lname", text)}
                                family="ArgonExtra"
                                style={styles.inputIcons}
                            />
                        </Block>
                        <Block>
                            <Button onPress={() => { }}>Save</Button>
                        </Block>
                    </ScrollView>
                </Block>
            </Block>
        );
    }
}

const styles = StyleSheet.create({
    profileUploader: {
        position: "relative"
    },
    profileCard: {
        padding: theme.SIZES.BASE,
        marginHorizontal: theme.SIZES.BASE,
        // marginTop: 80,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        backgroundColor: theme.COLORS.WHITE,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        shadowOpacity: 0.2,
        minHeight: "100%",
        zIndex: 2
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75
    },
    registerContainer: {
        width: width * 0.9,
        height: height * 0.78,
        marginTop: "25%",
        // backgroundColor: "#F4F5F7",
        borderRadius: 4,
        shadowColor: argonTheme.COLORS.BLACK,
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
        overflow: "hidden"
    },
    socialConnect: {
        fontWeight: "bold"
        // backgroundColor: argonTheme.COLORS.WHITE,
        // borderBottomWidth: StyleSheet.hairlineWidth,
        // borderColor: "#8898AA"
    },
    socialButtons: {
        width: 120,
        height: 40,
        backgroundColor: "#fff",
        shadowColor: argonTheme.COLORS.BLACK,
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1
    },
    socialTextButtons: {
        color: argonTheme.COLORS.PRIMARY,
        fontWeight: "800",
        fontSize: 14
    },
    inputIcons: {
        marginRight: 12
    },
    passwordCheck: {
        paddingLeft: 15,
        paddingTop: 13,
        paddingBottom: 30
    },
    createButton: {
        width: width * 0.5,
        marginTop: 25
    }
});

export default EditProfile;
