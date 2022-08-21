if (process.env.NODE_ENV !== "production") {
  // Load environment variables from .env file in non prod environments
  require("dotenv").config()
}
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const passport = require("passport")
const session = require('express-session');
// let {COOKIE_OPTIONS} = require("./authenticate")

require("./utils/connectdb")

require("./strategies/JwtStrategy")
require("./strategies/LocalStrategy")
require("./authenticate")



const userRouter = require("./routes/userRoutes")
const postRouter = require("./routes/postRoutes")

const app = express()
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(bodyParser.json())
app.use(passport.initialize())
app.use(session());
// app.use(session({ 
//   secret: process.env.COOKIE_SECRET,
//   // httpOnly: true,
//   // Since localhost is not having https protocol,
//   // secure cookies do not work correctly (in postman)
//   // secure: false,
//   // signed: true,
//   // maxAge: eval(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
//   // sameSite: "none",
//   cookie: COOKIE_OPTIONS
// }));


//Add the client URL to the CORS policy
const whitelist = process.env.WHITELISTED_DOMAINS
  ? process.env.WHITELISTED_DOMAINS.split(",")
  : []

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },

  credentials: true,
}

app.use(cors(corsOptions))


app.use("/users", userRouter)
app.use("/posts", postRouter)

app.get("/", function (req, res) {
  res.send({ status: "success" })
})

//Start the server in port 8081

const server = app.listen(process.env.PORT || 8081, function () {
  const port = server.address().port

  console.log("App started at port:", port)
})