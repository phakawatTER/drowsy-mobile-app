// local imgs
const Onboarding = require("../assets/imgs/bg.png");
const Logo = require("../assets/imgs/argon-logo.png");
const LogoOnboarding = require("../assets/imgs/argon-logo-onboarding.png");
const ProfileBackground = require("../assets/imgs/profile-screen-bg.png");
const RegisterBackground = require("../assets/imgs/register-bg.png");
const Pro = require("../assets/imgs/getPro-bg.png");
const ArgonLogo = require("../assets/imgs/argonlogo.png");
const iOSLogo = require("../assets/imgs/ios.png");
const androidLogo = require("../assets/imgs/android.png");
const defaultAvatar = require("../assets/imgs/default-avatar.png");
const saloon = require("../assets/imgs/icon/saloon-online.png");




const iconEvent = {
  "Acc Off":require("../assets/imgs/icon/icon_event/Acc-Off.png"),
  "Acc On":require("../assets/imgs/icon/icon_event/Acc-On.png"),
  "Crash":require("../assets/imgs/icon/icon_event/Crash.png"),
  "Dangerous driving":require("../assets/imgs/icon/icon_event/Dangerous-driving.png"),
  "Emergency":require("../assets/imgs/icon/icon_event/Emergency.png"),
  "Exhaust Emission":require("../assets/imgs/icon/icon_event/Exhaust-Emission.png"),
  "Fatigue driving":require("../assets/imgs/icon/icon_event/Fatigue-driving.png"),
  "Geo-fence":require("../assets/imgs/icon/icon_event/Geo-fence.png"),
  "Hard acceleration":require("../assets/imgs/icon/icon_event/Hard-acceleration.png"),
  "Hard deacceleration":require("../assets/imgs/icon/icon_event/Hard-deacceleration.png"),
  "High engine coolant Temperature":require("../assets/imgs/icon/icon_event/High-engine-coolant-Temperature.png"),
  "High RPM":require("../assets/imgs/icon/icon_event/High-RPM.png"),
  "Idle engine":require("../assets/imgs/icon/icon_event/Idle-engine.png"),
  "Illegal enter":require("../assets/imgs/icon/icon_event/Illegal-enter.png"),
  "Illegal ignition":require("../assets/imgs/icon/icon_event/Illegal-ignition.png"),
  "Logged in":require("../assets/imgs/icon/icon_event/Logged-in.png"),
  "Logged out":require("../assets/imgs/icon/icon_event/Logged-out.png"),
  "Low voltage":require("../assets/imgs/icon/icon_event/Low-voltage.png"),
  "MIL alarm":require("../assets/imgs/icon/icon_event/MIL-alarm.png"),
  "No card presented":require("../assets/imgs/icon/icon_event/No-card-presented.png"),
  "OBD communication error":require("../assets/imgs/icon/icon_event/OBD-communication-error.png"),
  "Power off":require("../assets/imgs/icon/icon_event/Power-off.png"),
  "Power on":require("../assets/imgs/icon/icon_event/Power-on.png"),
  "Quick Lane change":require("../assets/imgs/icon/icon_event/Quick-Lane-change.png"),
  "Sharp turn":require("../assets/imgs/icon/icon_event/Sharp-turn.png"),
  "Speeding":require("../assets/imgs/icon/icon_event/Speeding.png"),
  "Tamper":require("../assets/imgs/icon/icon_event/Tamper.png"),
  "Towing":require("../assets/imgs/icon/icon_event/Towing.png"),
  "Unlock alarm":require("../assets/imgs/icon/icon_event/Unlock-alarm.png"),

  // CUSTOM EVENTS
  "Drowsy":require("../assets/imgs/icon/icon_event/Vibration.png"),
  "Over CO":require("../assets/imgs/icon/icon_event/Exhaust-Emission.png")
}












// internet imgs

const ProfilePicture = 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?fit=crop&w=1650&q=80';

const Viewed = [
  'https://images.unsplash.com/photo-1501601983405-7c7cabaa1581?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1543747579-795b9c2c3ada?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1551798507-629020c81463?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1503642551022-c011aafb3c88?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?fit=crop&w=240&q=80',
];

const Products = {
  'View article': 'https://images.unsplash.com/photo-1501601983405-7c7cabaa1581?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=840&q=840',
};

export default {
  iconEvent,
  saloon,
  defaultAvatar,
  Onboarding,
  Logo,
  LogoOnboarding,
  ProfileBackground,
  ProfilePicture,
  RegisterBackground,
  Viewed,
  Products,
  Pro,
  ArgonLogo,
  iOSLogo,
  androidLogo
};