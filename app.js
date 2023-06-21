require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");   //step 1
const passport = require("passport");         //step 2
const passportLocalMongoose = require("passport-local-mongoose");    //step 3
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
  })); 
app.use(session({         //1
  secret:"mylittlesecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());    //2
app.use(passport.session());   //3

const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
  

mongoose.connect("mongodb://127.0.0.1:27017/userDB", mongooseOptions);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
  });
   
userSchema.plugin(passportLocalMongoose);  //4  //this is we gonna use to hash and salt the password
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);   

passport.use(User.createStrategy());       //5
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  //console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

 
app.get("/",function(req,res){
   res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));
  
app.get("/auth/google/secrets",       //to authenticate locally
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect home.
  res.redirect('/secrets');
});

app.get("/login",function(req,res){
    res.render("login");
 });

app.get("/register",function(req,res){
    res.render("register");
 });
 
app.get("/secrets",async function(req,res){
// if(req.isAuthenticated()){
//   res.render("secrets");
// }else(
//   res.redirect("/login")
// )     /// we ab want everyone to see secrets

try {
  const foundUsers = await User.find({ secret: { $ne: null } });
  res.render("secrets", { usersWithSecrets: foundUsers });
} catch (err) {
  console.log(err);
}
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else(
    res.redirect("/login")
  )
});

app.post("/submit", async function(req, res) {
  const submittedSecret = req.body.secret;
  //console.log(req.user);

  try {
    const foundUser = await User.findById(req.user.id);
    if (foundUser) {
      foundUser.secret = submittedSecret;
      await foundUser.save();
    }
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

app.post("/register", async function(req, res) {
  const newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});
 


app.post("/login", passport.authenticate("local"), function(req, res) {
  res.redirect("/secrets");
});

app.get("/logout", function(req, res) {
  req.logout(function() {});
  res.redirect("/");
});



app.listen(3000, function() {
    console.log("Server started on port 3000");
  });