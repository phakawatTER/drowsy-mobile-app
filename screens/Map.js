import React from 'react';
import { ImageBackground, Image, StyleSheet, StatusBar, Dimensions, Platform, AsyncStorage } from 'react-native';
import { Block, Button, Text, theme } from 'galio-framework';
import firebase from "firebase"
const { height, width } = Dimensions.get('screen');
import { Images, argonTheme } from '../constants';
import { HeaderHeight } from "../constants/utils";
import MapView from 'react-native-maps';
import { config } from "../firebase-config"

export default class Pro extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      speed: 0,
      direction: 0,
      // location: { lat: 0, lng: 0 },// current location of user car ,
      location: {
        latitude: 5,
        longitude: 5,
        latitudeDelta: 0,
        longitudeDelta: 0,
      },
      gasdata: { co: 0, lpg: 0 }
    }

    // Reference to map
    this.mapRef = React.createRef()
    this.markerRef = React.createRef()
    this.onMapReadyDisplay = this.onMapReadyDisplay.bind(this)
    try {
      firebase.initializeApp(config)
    } catch (err) {
      // console.log(err)
    }
  }
  loadUserInfo = async () => {
    let userInfo = AsyncStorage.getItem("userInfo").then(data => {
      let { navigation } = this.props
      let handle = navigation.getParam("handle")
      let userInfo = JSON.parse(data)
      let { uid } = userInfo
      this.setState({ userInfo })
      if (handle !== "tracking") return
      let databaseRef = firebase.database().ref()
      let latestTrip = databaseRef.child(`trip/${uid}`)
      latestTrip.on("value", snapshot => {
        trip = snapshot.val()
        if (!trip) return
        acctime = null
        Object.keys(trip).map(key => {
          acctime = key
        })


        let tripDataRef = databaseRef.child(`trip/${uid}/${acctime}`).orderByKey().limitToLast(1)
        tripDataRef.on("child_added", snapshot => {
          // console.log(snapshot.val())

          let tripdata = snapshot.val()
          if (!tripdata) return
          let coordinate = tripdata.latlng // COORDINATE OF VEHICLE
          let co = tripdata.co // CO LEVEL
          let direction = tripdata.direction
          let speed = tripdata.speed
          // console.log(coordinate)
          this.setState({
            speed,
            direction,
            location: {
              latitude: parseFloat(coordinate[0]),
              longitude: parseFloat(coordinate[1])
            }, gasdata: { co: co }
          }, () => {
            this.updateCarMarker()
          })
        })
      })
    }).catch(err => {
    })
  }

  componentDidMount() {
    let { navigation } = this.props
    let latlng = navigation.getParam("latlng")
    let back = navigation.getParam("back")
    let time = navigation.getParam("time")
    let event = navigation.getParam("event")
    let speed = navigation.getParam("speed")
    let direction = navigation.getParam("direction")
    this.setState({
      speed,
      event,
      direction,
      location: latlng ? {
        latitude: parseFloat(latlng[0]),
        longitude: parseFloat(latlng[1])
      } : this.state.location,
      back: back,
      time: time
    })
    this.loadUserInfo()
  }

  componentWillUpdate(nextProps, nextState) {
    // IF CURRENT LOCATION IS NOT THE SAME AS THE NEXT LOCATION SO ANIMATE MARKER
    if (this.state.location !== nextState.location) {
      if (Platform.OS == "Andriod") {
        this.markerRef.current.animateMarkerToCoordinate(nextState.location, 3200);
      } else {
        // alert(JSON.stringify(nextProps.animated_location))
        // this.state.animated_location.timing({ ...nextState.animated_location}).start()
      }
    }
  }

  updateCarMarker = () => {
    let { location, direction } = this.state
    // this.mapRef.current.animateToCoordinate coordinate, 1000)
    let camera = {
      center: location,
    }
    // this.mapRef.current.animateCamera(camera)
    this.mapRef.current.fitToCoordinates([location], 2000)
  }

  onMapReadyDisplay = async () => {
    let { location } = this.state
    this.mapRef.current.animateCamera({ center: location }, { duration: 2000 })
    setTimeout(() => {
      try {
        this.markerRef.current.showCallout()
        this.mapRef.current.fitToCoordinates([location], { animated: true })
      } catch (err) { console.log("THIS IS ERROR", err) }

    }, 2000)
  }

  render() {
    const { navigation } = this.props;
    const handle = navigation.getParam("handle")
    const { time, event } = this.state
    const renderCarMarker = () => {
      // alert(JSON.stringify(this.state.location))
      return (
        handle === "display" ?
          <MapView.Marker
            ref={this.markerRef}
            title={event}
            description={`Occured at: ${time}`}
            // description={`Occured at: ${time}`}
            coordinate={this.state.location}
          >
            <Image source={Images.saloon} style={{
              width: 40,
              height: 60,
              transform: [
                { rotate: `${this.state.direction}deg` }
              ]
            }} />
          </MapView.Marker>
          :
          <MapView.Marker
            ref={this.markerRef}
            coordinate={this.state.location}
          >
            <Image source={Images.saloon} style={{
              width: 40,
              height: 60,
              transform: [
                { rotate: `${this.state.direction}deg` }
              ]
            }} />
          </MapView.Marker>
      )
    }


    return (
      <Block flex style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Block flex>
          <Block>
            <Block
              style={{ ...styles.mapHeader }}
            >
              {
                handle === "tracking" ?
                  <Block style={{ ...styles.info, ...styles.topInfo }}
                    row
                    space={"evenly"}
                  >
                    <Text color={"#FFFFFF"} bold>
                      Current Speed :{parseFloat(this.state.speed).toFixed(2)} km/h
                  </Text>
                    <Text color={"#FFFFFF"} bold>
                      CO: {this.state.gasdata.co} ppm
                  </Text>
                  </Block>
                  :
                  <Block style={{ ...styles.info, paddingHorizontal: "10%", paddingTop: 20 }}
                    flex
                    space={"evenly"}
                  >
                    <Text color={"#FFFFFF"} bold>
                      Occured at {this.props.navigation.getParam("time")}
                    </Text>
                    <Text color={"#FFFFFF"} bold>
                      Current Speed :{parseFloat(this.state.speed).toFixed(2)} km/h
                  </Text>
                  </Block>
              }

            </Block>

            <MapView
              maxZoonLevel={10}
              rotateEnabled={false}
              onMapReady={() => {
                handle == "display" ?
                  this.onMapReadyDisplay()
                  : () => { }
              }}
              ref={this.mapRef}
              style={{ ...styles.mapStyle }}
              initialRegion={{
                latitude: 13.736717,
                longitude: 100.523186,
              }}
            >
              {renderCarMarker()}
            </MapView>
            <Button
              shadowless
              style={styles.button}
              color={"#20232a"}
              onPress={() => navigation.navigate(this.state.back)}>
              <Text bold color={theme.COLORS.WHITE}>Go Back</Text>
            </Button>
          </Block>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  topInfo: {
    paddingVertical: "10%",
    // color: "white"
  },
  mapHeader: {
    maxHeight: 0.1 * height,
    height: 0.1 * height,
  },
  mapStyle: {
    height: 0.8 * height,
    width: width
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
  container: {
    backgroundColor: "#20232a",
    marginTop: Platform.OS === 'android' ? -HeaderHeight : 0,
  },
  padded: {
    paddingHorizontal: theme.SIZES.BASE * 2,
    zIndex: 3,
    position: 'absolute',
    bottom: Platform.OS === 'android' ? theme.SIZES.BASE * 2 : theme.SIZES.BASE * 3,
  },
  button: {
    width: width,
    height: 0.1 * height,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  pro: {
    backgroundColor: argonTheme.COLORS.INFO,
    paddingHorizontal: 8,
    marginLeft: 3,
    borderRadius: 4,
    height: 22,
    marginTop: 15
  },
  gradient: {
    zIndex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 66,
  },
});
