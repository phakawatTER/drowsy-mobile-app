import React from "react";
import {
    ScrollView,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    TouchableHighlight,
    Image,
    Platform,
    AsyncStorage
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import Spinner from "react-native-loading-spinner-overlay"
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions'
import * as FileSystem from 'expo-file-system';
import { config } from "../firebase-config"
import firebase from "firebase";
import moment from "moment";
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
            isUploading: false,
            uploadingPercentage: 0,
            isLoading: true,
            fname: "",
            lname: "",
            email: "",
            profile: ""
        }
        try {
            firebase.initializeApp(config)
        } catch (err) { }
        this.userRef = firebase.database().ref().child("user")

    }

    getUserInfo = () => {
        let {
            uid,
            profile,
            email,
            fname,
            lname
        } = this.props.navigation.getParam("userInfo")
        this.setState({ email, fname, lname, uid, profile, original_profile: profile })
    }

    componentDidMount() {
        this.getUserInfo()
        this.getPermissionAsync()
    }

    // UPDATE ASYNC STORAGE
    updateAsyncUserInfoStorage = () => {
        let { profile, fname, lname } = this.state
        AsyncStorage.getItem("userInfo").then(userInfo => {
            userInfo = JSON.parse(userInfo)
            userInfo.profile = profile
            userInfo.fname = fname
            userInfo.lname = lname
            console.log("this is user info async ", userInfo)
            AsyncStorage.setItem("userInfo", JSON.stringify(userInfo))
        })
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

    updateProfile = () => {
        let { fname, lname, profile, original_profile, uid } = this.state
        const update = this.props.navigation.getParam("updateUserInfo")
        update(fname, lname, profile)
        if (original_profile !== profile) {
            this.uploadProfilePic()
        } else {
            this.setState({ isLoading: true })
            let userTargetRef = this.userRef.child(uid).update({
                fname,
                lname,
            }, err => {
                // if (err) alert("Failed to update your profile information")
                // else alert("Successfully update your profile information")
                this.setState({ isLoading: false })
                this.updateAsyncUserInfoStorage()


            })
        }
    }

    uploadProfilePic = async () => {
        this.setState({ isLoading: true, isUploading: true })
        let { uid, profile, fname, lname } = this.state
        let response = await fetch(profile)
        let blob = await response.blob()
        let storageRef = firebase.storage().ref().child(`/profilepic/${uid}/${uid}-${moment.unix()}`)
        let task = storageRef.put(blob)
        task.on("state_changed", snapshot => {
            let uploadingPercentage = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(2)
            this.setState({ uploadingPercentage })
            console.log("THIS IS PERCENTAGE:" + percentage)
        }, err => {
            this.setState({ isLoading: false, isUploading: false, uploadingPercentage: 0 })
            console.log(err)
        }, () => {
            task.snapshot.ref.getDownloadURL().then(URL => {
                let userTargetRef = this.userRef.child(uid).update({
                    fname,
                    lname,
                    profile: URL
                }, err => {
                    this.setState({ isLoading: false, isUploading: false, uploadingPercentage: 0 })
                    this.updateAsyncUserInfoStorage()


                })
            })

        })
    }

    onChangeHandler = (handle, text) => {
        this.setState({
            [handle]: text
        })
    }

    render() {
        let {
            isUploading,
            uploadingPercentage,
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
                    textContent={isUploading ? `${uploadingPercentage}%` : null}

                />
                <Block flex style={styles.registerContainer}>
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
                        <Text>Email</Text>
                        <Input
                            editable={false}
                            value={email}
                            onChangeText={(text) => this.onChangeHandler("email", text)}
                            family="ArgonExtra"
                            style={styles.inputIcons}
                        />
                    </Block>
                    <Text>Firstname</Text>

                    <Block>
                        <Input
                            // editable={false}
                            value={fname}
                            onChangeText={(text) => this.onChangeHandler("fname", text)}
                            family="ArgonExtra"
                            style={styles.inputIcons}
                        />
                    </Block>
                    <Block>
                        <Text>Lastname</Text>

                        <Input
                            // editable={false}
                            value={lname}
                            onChangeText={(text) => this.onChangeHandler("lname", text)}
                            family="ArgonExtra"
                            style={styles.inputIcons}
                        />
                    </Block>
                    <Block>
                        <Button onPress={() => { this.updateProfile() }} style={{ backgroundColor: "#20232a" }}>Save</Button>
                    </Block>
                </Block>
            </Block>
        );
    }
}

const styles = StyleSheet.create({
    spinnerTextStyle:{
        color:"#fff"
    },
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
