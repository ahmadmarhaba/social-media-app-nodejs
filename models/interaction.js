const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Interaction = new Schema({
    Content_ID: {
        type: String,
        default: "",
    },
    User_ID: {
        type: String,
        default: "",
    },
    Action: {
        type: Number,
        default: 0,
    },
  })

  module.exports = mongoose.model("Interaction", Interaction)