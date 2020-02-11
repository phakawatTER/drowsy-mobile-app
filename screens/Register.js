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
import { API_REGISTER } from "../link.js"
import axios from "axios";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import { PWD_SECRET } from "../constants/pwd"
import { sha512 } from "js-sha512";
const { width, height } = Dimensions.get("screen");

class Register extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      fname: "",
      lname: "",
      email: "",
      mobile: "",
      password: "",
      conpassword: "",
      passwordState: "",
      conpasswordState: "",
      emailState: "",
      mobileState: "",
      fnameState: "",
      lnameState: "",
    }
    this.onChangeHandler = this.onChangeHandler.bind(this)
  }

  fnameIsOk = () => {
    let { fname } = this.state
    let isStrong = fname.search(/[a-zA-Z0-9]{1,}$/)
    if (isStrong === 0) this.setState({ fnameState: "success" })
    else this.setState({ fnameState: "danger" })
  }

  lnameIsOk = () => {
    let { lname } = this.state
    let isStrong = lname.search(/[a-zA-Z0-9]{1,}$/)
    if (isStrong === 0) this.setState({ lnameState: "success" })
    else this.setState({ lnameState: "danger" })
  }

  passIsOk = () => {
    let { password } = this.state
    isStrong = (password.search(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/))
    // isStrong = 0 means Password is strong
    // isStrong = -1 means Password is weak
    if (isStrong === 0) this.setState({ passwordState: "success" })
    else this.setState({ passwordState: "danger" })
  }
  emailIsOk = () => {
    let { email } = this.state
    isStrong = email.search(/^.+@.+\..+/)
    if (isStrong === 0) this.setState({ emailState: "success" })
    else this.setState({ emailState: "danger" })
  }
  mobileIsOk = () => {
    let { mobile } = this.state
    let isStrong = mobile.search(/^[0-9]{9,10}$/)
    console.log(isStrong)
    if (isStrong === 0) this.setState({ mobileState: "success" })
    else this.setState({ mobileState: "danger" })
  }

  onChangeHandler = (name, text) => {
    if (name === "mobile") {
      let isNumber = text.search(/[0-9]{0,10}$/)
      if (isNumber === 0) return this.setState({ [name]: text }, () => {
        this.mobileIsOk()
      })
      else return
    }
    this.setState({ [name]: text }, () => {
      if (name === "fname")
        this.fnameIsOk()

      if (name === "lname")
        this.lnameIsOk()

      if (name === "password")
        this.passIsOk()

      if (name === "email")
        this.emailIsOk()

    })

  }

  checkInputValidation = () => {
    let {
      fnameState,
      lnameState,
      emailState,
      mobileState,
      passwordState,
      conpasswordState,
      password,
      conpassword
    } = this.state
    let isValid = true
    if (fnameState !== "success") {
      this.setState({ fnameState: "danger" })
      isValid = false
    }
    if (lnameState !== "success") {
      this.setState({ lnameState: "danger" })
      isValid = false
    }
    if (emailState !== "success") {
      this.setState({ emailState: "danger" })
      isValid = false
    }
    if (mobileState !== "success") {
      this.setState({ mobileState: "danger" })
      isValid = false
    }
    if (passwordState !== "success") {
      this.setState({ passwordState: "danger" })
      isValid = false
    }
    if (conpassword !== password) {
      if (conpasswordState !== "success") {
        this.setState({ conpasswordState: "danger" })
        isValid = false
      }
    } else {
      if (passwordState === "success")
        this.setState({ conpasswordState: "success" })
      else
        this.setState({ conpasswordState: "danger" })

    }
    return isValid
  }

  createAccount = () => {
    let isValid = this.checkInputValidation()
    if (isValid) {
      let {
        fname,
        lname,
        email,
        mobile,
        password,
      } = this.state
      let payload = {
        fname: fname,
        lname: lname,
        email: email,
        mobile: mobile,
        password: sha512(`${password}${PWD_SECRET}`)
      }
      axios.post(API_REGISTER, payload)
        .then(response => {
          if (response.status === 200) {
            let data = response.data
            let { code } = data
            if (code === 200) {
              alert("Successfully registered")
              this.props.navigation.navigate("Login")
            }
            else if (code === 410) {
              this.setState({
                emailState: "danger"
              })
              alert("Email has been taken")
            }
          }
        }).catch(err => {
          console.log(err)
        })

    } else {
      alert("Check your input information")
    }

  }



  render() {
    let {
      fname,
      lname,
      email,
      mobile,
      password,
      conpassword
    } = this.state
    return (

      <Block flex middle>

        <StatusBar hidden />
        <Block flex middle>

          <Block flex style={styles.registerContainer}>
            <ScrollView
              vertical
            >
              <Block flex style={{ marginTop: "10%" }}>
                <Block flex={0.1} middle style={styles.socialConnect}>
                  <Text color="#8898AA" size={25}>
                    Sign up
                </Text>
                </Block>

                <Block flex center style={{ paddingBottom: 15 }}>
                  <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                    enabled
                  >
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Input
                        success={this.state.fnameState === "success" ? true : false}
                        error={this.state.fnameState === "danger" ? true : false}
                        value={fname}
                        onChangeText={(text) => this.onChangeHandler("fname", text)}
                        placeholder="Firstname"
                        iconContent={
                          <Icon
                            size={16}
                            color={argonTheme.COLORS.ICON}
                            name="hat-3"
                            family="ArgonExtra"
                            style={styles.inputIcons}
                          />
                        }
                      />
                    </Block>
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Input
                        success={this.state.lnameState === "success" ? true : false}
                        error={this.state.lnameState === "danger" ? true : false}
                        value={lname}
                        onChangeText={(text) => this.onChangeHandler("lname", text)}
                        placeholder="Lastname"
                        iconContent={
                          <Icon
                            size={16}
                            color={argonTheme.COLORS.ICON}
                            name="hat-3"
                            family="ArgonExtra"
                            style={styles.inputIcons}
                          />
                        }
                      />
                    </Block>
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
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Input
                        success={this.state.mobileState === "success" ? true : false}
                        error={this.state.mobileState === "danger" ? true : false}
                        value={mobile}
                        onChangeText={(text) => this.onChangeHandler("mobile", text)}
                        placeholder="Mobile phone"
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
                      {
                        this.state.password !== "" ?
                          <Block row style={styles.passwordCheck} >
                            <Text size={12} color={argonTheme.COLORS.MUTED} >
                              password strength:
                            </Text>
                            <Text bold size={12} color={
                              this.state.passwordState === "success" ?
                                argonTheme.COLORS.SUCCESS
                                :
                                argonTheme.COLORS.WARNING
                            }>
                              {" "}
                              {
                                this.state.passwordState === "success" ?
                                  "strong" : this.state.passwordState === "danger" ?
                                    "weak" : null
                              }
                            </Text>
                          </Block>
                          : this.state.password !== "" ?
                            <Text size={12} color={argonTheme.COLORS.MUTED} >
                              Your password is empty
                            </Text>
                            : null
                      }
                      <Text size={12} color={argonTheme.COLORS.MUTED} >
                        Your password must have 8-20 characters and contains
                        atleast 1 lowercase and 1 uppercase letter.
                      </Text>

                    </Block>
                    <Block width={width * 0.8}>
                      <Input
                        success={this.state.conpasswordState === "success" ? true : false}
                        error={this.state.conpasswordState === "danger" ? true : false}
                        value={conpassword}
                        onChangeText={(text) => this.onChangeHandler("conpassword", text)}
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
                    <Block middle>
                      <Button color="primary" style={styles.createButton} onPress={() => this.createAccount()}>
                        <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                          CREATE ACCOUNT
                        </Text>
                      </Button>
                    </Block>
                  </KeyboardAvoidingView>
                </Block>
              </Block>
            </ScrollView>
          </Block>
        </Block>
      </Block >
    );
  }
}

const styles = StyleSheet.create({
  registerContainer: {
    width: width * 0.9,
    height: height * 0.78,
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

export default Register;
