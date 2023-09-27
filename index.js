const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
const cors = require("cors");
dotenv.config();

const app = express();

app.use(cors());

const User = require("./models/user.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./public"));

// APIs-
app.get("/health", (req, res) => {
  res.json({ message: "all right" });
});

app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(process.env.REACT_APP_BACKEND_URL);


    let user = await User.findOne({ email });
    if (user) {
      res.json({ message: "User already exists" });
    } else {
      res.json({ message: "User created successfully" });
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });
      await newUser.save();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if(user) {
      const passwordMatched = await bcrypt.compare(password, user.password)
      if(passwordMatched) {
        const jwToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, { expiresIn: 60 })
        res.json({
          status: 'SUCCESS',
          message: "You've logged in successfully",
          jwToken
        })
      } else {
      res.json({
        status: 'FAIL',
        message: 'Incorrect password'
      })
    }
    } else {
      res.json({
        status: 'FAIL',
        message: 'User does not exist'
      })
    }
  } catch (error) {
    console.log(error)
    res.json({
      status: 'FAIL',
      message: 'Something went wrong', error
    })
  }
})



// Error Handler-
app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() =>
      console.log(`Server running on http://localhost:${process.env.PORT}`)
    )
    .catch((error) => console.error(error));
});
