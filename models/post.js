const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Post = new Schema({
    Parent_ID: {
        type: String,
        default: null,
    },
    User_ID: {
        type: String,
        default: "",
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
})

module.exports = mongoose.model("Post", Post)