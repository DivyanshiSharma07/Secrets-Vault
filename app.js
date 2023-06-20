const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const bcrypt = require("bcrypt");    //level 4 security
const saltRounds = 10;


app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
  }));
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
  

mongoose.connect("mongodb://127.0.0.1:27017/userDB", mongooseOptions);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
  });
  


  const User = new mongoose.model("User", userSchema);   

app.get("/",function(req,res){
   res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
 });

 app.get("/register",function(req,res){
    res.render("register");
 });

 app.post("/register", async function(req, res) {
  try {
    bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      const newUser = new User({
        email: req.body.username,
        password: hash
      });

      try {
        await newUser.save();
        res.render("secrets"); // Level 1 - This page is only accessible after registering
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login",async function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    try {
        const founduser = await User.findOne({ email: username });
        if (founduser) {
          bcrypt.compare(password, founduser.password, function(err, result) {
            if (result === true) {
              res.render("secrets");
            } else {
              res.status(401).send("Invalid password");
            }
          });
        } else {
          res.status(404).send("user not found");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
});


app.listen(3000, function() {
    console.log("Server started on port 3000");
  });