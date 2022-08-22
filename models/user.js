const mongoose = require("mongoose")
const Schema = mongoose.Schema

const passportLocalMongoose = require("passport-local-mongoose")

const Session = new Schema({
  refreshToken: {
    type: String,
    default: "",
  },
})
const Follow = new Schema({
  User_ID: {
    type: Object,
    default: null,
  },
})

const User = new Schema({
  name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  image: {
    type: Number,
    default: "",
  },
  authStrategy: {
    type: String,
    default: "local",
  },
  refreshToken: {
    type: [Session],
  },
  followed: {
    type: [Follow],
  },
})

//Remove refreshToken from the response
User.set("toJSON", {
  transform: function (doc, ret, options) {
    delete ret.refreshToken
    return ret
  },
})
User.index({name: 'text'});
User.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", User)