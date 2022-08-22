const express = require("express")
const router = express.Router()
const User = require("../models/user")
const passport = require("passport")
const jwt = require("jsonwebtoken")

const {
    getToken,
    COOKIE_OPTIONS,
    getRefreshToken,
    verifyUser,
  } = require("../authenticate")

router.post("/signup", (req, res, next) => {

  // Verify that first name is not empty
  if (!req.body.name || !req.body.email || !req.body.password) {
    res.statusCode = 500
    res.send({
      name: "Error",
      message: "All fields are required",
    })
  } else {
    User.register(
      new User({ username: req.body.email }),
      req.body.password,
      (err, user) => {
        if (err) {
          res.statusCode = 500
          res.send(err)
        } else {
          user.name = req.body.name
          user.email = req.body.email
          const token = getToken({ _id: user._id })
          const refreshToken = getRefreshToken({ _id: user._id })
          user.refreshToken.push({ refreshToken })
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500
              res.send(err)
            } else {
              res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
              res.send({ success: true, token })
            }
          })
        }
      }
    )
  }
})

router.post("/login", passport.authenticate("local"), (req, res, next) => {
    const token = getToken({ _id: req.user._id })
    const refreshToken = getRefreshToken({ _id: req.user._id })
    User.findById(req.user._id).then(
      user => {res
        user.refreshToken.push({ refreshToken })
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500
            res.send(err)
          } else {
            res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)

            // console.log(refreshToken,req.signedCookies.refreshToken)
            res.send({ success: true, token })
          }
        })
      },
      err => next(err)
    )
  })
  router.post("/refreshToken", (req, res, next) => {
    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const userId = payload._id;
        
        User.findOne({ _id: userId }).then(
          user => {
            if (user) {
              // Find the refresh token against the user record in database
              const tokenIndex = user.refreshToken.findIndex(
                item => item.refreshToken === refreshToken
              )
              if (tokenIndex === -1) {
                res.statusCode = 401
                res.send("Unauthorized")
              } else {
                const token = getToken({ _id: userId })
                // If the refresh token exists, then create new one and replace it.
                const newRefreshToken = getRefreshToken({ _id: userId })
                user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken }
                user.save((err, user) => {
                  if (err) {
                    res.statusCode = 500
                    res.send(err)
                  } else {
                    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
                    res.send({ success: true, token })
                  }
                })
              }
            } else {
              res.statusCode = 401
              res.send("Unauthorized")
            }
          },
          err => next(err)
        )
      } catch (err) {
        res.statusCode = 401
        res.send("Unauthorized")
      }
    } else {
      res.statusCode = 401
      res.send("Unauthorized")
    }
  })

  router.get("/me", verifyUser, (req, res, next) => {
    res.send({
      refreshToken : req.user.refreshToken , 
      name : req.user.name,
      image : req.user.image
    })
  })

  router.get("/logout", verifyUser, (req, res, next) => {
    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies

    User.findById(req.user._id).then(
      user => {
        const tokenIndex = user.refreshToken.findIndex(
          item => item.refreshToken === refreshToken
        )
  
        if (tokenIndex !== -1) {
          user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove()
        }
  
        user.save((err, user) => {
          if (err) {
            res.statusCode = 500
            res.send(err)
          } else {
            res.clearCookie("refreshToken", COOKIE_OPTIONS)
            res.send({ success: true })
          }
        })
      },
      err => next(err)
    )
  })

  router.post("/search", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(!req.body.name) return;
    let name = req.body.name.trim()
    User.find({name : {$regex : new RegExp(name, "i")}}, {name:1}).then(async (docs) => {
        let arr = [];
        docs.forEach(doc => {
          arr.push(doc.name);
        });
        return arr
      }).then((data)=>{
        res.send({ success: true , users : data })
      }).catch(err =>{
        res.send({ success: false })
      });
  })

  router.post("/follow", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(!req.body.name) return;
    let name = req.body.name.trim()
    const user = await User.findOne({ _id : req.user._id });
    const user2 = await User.findOne({ name });

    const index = user.followed.findIndex(
      item => item.User_ID.equals(user2._id)
    )
    if (index === -1) {
      user.followed.push({ User_ID: user2._id })
    }else{
      user.followed.id(user.followed[index]._id).remove()
    }
    user.save((err, user) => {
      if (err) {
        res.statusCode = 500
        res.send({ success: false })
      } else {
        res.send({ success: true, followed : index === -1 })
      }
    })
  })

module.exports = router