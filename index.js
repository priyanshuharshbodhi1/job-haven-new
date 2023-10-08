const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();

app.use(cookieParser());
app.use(cors());

const User = require("./models/user.js");
const Job = require("./models/addjob.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./public"));

// APIs-
app.get("/health", (req, res) => {
  res.json({ message: "all right" });
});

app.get("/api/joblist", async (req, res) => {
  Job.find()
    .then((jobs) => res.json(jobs))
    .catch((err) => res.json(err));
});

app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, recruiter } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.findOne({ email });
    if (user) {
      res.json({ message: "User already exists" });
    } else {
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        recruiter: req.body.recruiter === "true",
      });
      await newUser.save();
      res.redirect(302, "http://localhost:3000");
      console.log("User Created Successfully");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (passwordMatched) {
        const jwToken = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
          expiresIn: 6000,
        });
        res.cookie("jwt", jwToken, { httpOnly: true });
        res.redirect(302, "http://localhost:3000/jobfinder");
        return;
      } else {
        res.json({
          status: "FAIL",
          message: "Incorrect password",
        });
      }
    } else {
      res.json({
        status: "FAIL",
        message: "User does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "FAIL",
      message: "Something went wrong",
      error,
    });
  }
});

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;

    next();
  });
};

const isRecruiter = (req, res, next) => {
  if (req.user.recruiter) {
    next();
  } else {
    res.json({
      status: "FAIL",
      message: "You're not allowed to access this page",
    });
  }
};

app.post("/api/jobpost", isAuthenticated, isRecruiter, async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json({ message: "Job listing created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating job listing", error });
  }
});

app.get("/api/isloggedin", isAuthenticated, (req, res) => {
  res.json({ isLoggedIn: true });
});

app.get("/api/isrecruiter", isAuthenticated, isRecruiter, async (req, res) => {
  try {
    res.json({ isRecruiter: true });
  } catch (error) {
    res.status(500).json({ message: "user not logged in", error });
  }
});

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
