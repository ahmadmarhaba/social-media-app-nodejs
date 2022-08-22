const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Interaction = new Schema({
    User_ID: {
        type: Object,
        default: null,
    },
    Action: {
        type: Number,
        default: 0,
    },
  })

const Post = new Schema({
    Parent_ID: {
        type: Object,
        default: null,
    },
    User_ID: {
        type: Object,
        default: null,
    },
    Post_Title: {
        type: String,
        default: null,
    },
    Post_Text: {
        type: String,
        default: "",
    },
    Post_Date: {
        type: String,
        default: "",
    },
    Post_Flag: {
        type: String,
        default: "",
    },
    Post_Edited: {
        type: Boolean,
        default: false,
    },
    Post_MediaUrl: {
        type: String,
        default: "",
    },
    Post_MediaFiles: {
        type: String,
        default: "",
    },
    Post_MediaFolder: {
        type: String,
        default: "",
    },
    Interaction: {
        type: [Interaction],
    },
})

module.exports = mongoose.model("Post", Post)