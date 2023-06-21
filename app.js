const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");   //step 1
const passport = require("passport");         //step 2
const passportLocalMongoose = require("passport-local-mongoose");    //step 3


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
    password: String
  });
   
userSchema.plugin(passportLocalMongoose);  //4  //this is we gonna use to hash and salt the password

const User = new mongoose.model("User", userSchema);   

passport.use(User.createStrategy());       //5

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


 
app.get("/",function(req,res){
   res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
 });

app.get("/register",function(req,res){
    res.render("register");
 });
 
app.get("/secrets",function(req,res){
if(req.isAuthenticated()){
  res.render("secrets");
}else(
  res.redirect("/login")
)
});

app.post("/register", async function(req, res) {
  User.register(req.body.username, req.body.password, function(err, user) {
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