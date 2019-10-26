import React from "react";
import {
    ScrollView,
    StyleSheet,
    ImageBackground,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";
import axios from "axios";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import { API_LOGIN } from "../link"
import { AsyncStorage } from "react-native"
const { width, height } = Dimensions.get("screen");

class Login extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            email: "",
            password: "",
            passwordState: "",
            emailState: "",
        }
    }

    getUserInfo = async () => {
        let userInfo = await AsyncStorage.getItem("userInfo")
        userInfo = JSON.parse(userInfo)
        if (userInfo) this.props.navigation.navigate("Profile")

    }

    componentWillMount() {
        this.getUserInfo()
    }

    storeUserInfo = async (storedData) => {
        try {
            await AsyncStorage.setItem("userInfo", storedData)
        } catch (err) {
            console.log(err)
        }
    }
    onChangeHandler = (name, text) => {
        this.setState({
            [name]: text
        })
    }
    signIn = () => {
        let { email, password } = this.state
        let payload = {
            username: email,
            password: password,
            from: "app"
        }
        axios.post(API_LOGIN, payload)
            .then(response => {
                if (response.status == 200) {
                    let data = response.data
                    let { code } = data
                    console.log("FUCK", data.userInfo)
                    if (code === 200) {
                        this.storeUserInfo(JSON.stringify(data.userInfo))
                        this.props.screenProps.setUserInfo(data.userInfo)
                        this.setState({
                            emailState: "success",
                            passwordState: "success"
                        })
                        this.props.navigation.navigate("Profile")
                    } else {
                        this.setState({
                            emailState: "danger",
                            passwordState: "danger"
                        })
                    }
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    onChangeHandler = (name, text) => {
        this.setState({ [name]: text })
    }


    render() {
        let {
            emailState,
            passwordState,
            email,
            password,
        } = this.state
        return (
            // <Block></Block>
            <ScrollView>
                <Block flex middle>
                    <StatusBar hidden />
                    <Block flex middle>
                        <Block style={styles.registerContainer}>
                            <Block flex >
                                <Block flex={0.15} middle style={styles.socialConnect}>
                                    <Text color="#8898AA" h4>
                                        Sign in
                </Text>
                                </Block>
                                <Block flex center>
                                    <KeyboardAvoidingView
                                        style={{ flex: 1, paddingTop: 20 }}
                                        behavior="padding"
                                        enabled
                                    >
                                        <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                                            <Input
                                                success={this.state.emailState === "success" ? true : false}
                                                error={this.state.emailState === "danger" ? true : false}
                                                autoCapitalize='none'
                                                value={email}
                                                onChangeText={(text) => this.onChangeHandler("email", text)}
                                                placeholder="Email"
                                                iconContent={
                                                    <Icon
                                                        size={16}
                                                        color={argonTheme.COLORS.ICON}
                                                        name="ic_mail_24px"
                                                        family="ArgonExtra"
                                                        style={styles.inputIcons}
                                                    />
                                                }
                                            />
                                        </Block>
                                        <Block width={width * 0.8}>
                                            <Input
                                                success={this.state.passwordState === "success" ? true : false}
                                                error={this.state.passwordState === "danger" ? true : false}
                                                value={password}
                                                onChangeText={(text) => this.onChangeHandler("password", text)}
                                                password
                                                placeholder="Password"
                                                iconContent={
                                                    <Icon
                                                        size={16}
                                                        color={argonTheme.COLORS.ICON}
                                                        name="padlock-unlocked"
                                                        family="ArgonExtra"
                                                        style={styles.inputIcons}
                                                    />
                                                }
                                            />
                                        </Block>
                                        {
                                            emailState === "danger" || passwordState === "danger" ?
                                                <Block row center >
                                                    <Text center color={theme.COLORS.ERROR}>
                                                        Incorrect email or password !
                                                    </Text>
                                                </Block>
                                                : null
                                        }
                                        <Block middle>
                                            <Button color="success" style={styles.createButton} onPress={() => this.signIn()}>
                                                <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                                                    Sign in
                        </Text>
                                            </Button>
                                            <Button color="default" style={styles.createButton} onPress={() => {
                                                this.props.navigation.navigate("Register")
                                            }}>
                                                <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                                                    Sign up
                        </Text>
                                            </Button>
                                            <Block row style={styles.passwordCheck}>
                                                <Text>
                                                    Forgot your password?
                        </Text>
                                            </Block>
                                        </Block>

                                    </KeyboardAvoidingView>
                                </Block>
                            </Block>
                        </Block>
                    </Block>
                </Block>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    registerContainer: {
        width: width * 0.9,
        marginTop: `10%`,
        // height: height * 0.5,
        // backgroundColor: "rgba(255,255,255,0.6)",
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
        fontWeight:"bold"
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

export default Login;
