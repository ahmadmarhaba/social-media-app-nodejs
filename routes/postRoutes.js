const express = require("express")
const router = express.Router()
const Post = require("../models/post")
const User = require("../models/user")
var mongoose = require('mongoose');

const {
    verifyUser,
  } = require("../authenticate")

router.post("/create", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(req.body.contentID && req.body.title) return;
    if(req.body.title && req.body.title.trim().length == 0) return;
    if(!req.body.contentID && !req.body.title) return;
    if(!req.body.text || req.body.text.trim().length == 0) return;
    let Parent_ID = req.body.contentID ? mongoose.Types.ObjectId(req.body.contentID) : null
    const post = new Post({
        Parent_ID,
        Post_Title : req.body.title ? req.body.title.trim() : null,
        Post_Text : req.body.text.trim(),
        User_ID : req.user._id,
        Post_Date : Date.now(),
        Post_Flag : "active",
        Post_Edited : false,
        Post_MediaUrl : "",
        Post_MediaFiles : "",
        Post_MediaFolder : "",
    });
    const result = await post.save();
    if(result._id){
        res.send({ success: true })
    }else{
        res.send({ success: false })
    }
})

router.post("/fetch", verifyUser, async (req, res, next) => {

    if(!req.user._id) return;
    let query = { 
      Parent_ID : req.body.parentID ? mongoose.Types.ObjectId(req.body.parentID) : null,
       Post_Flag : "active",
    };
    if(req.body.username && req.body.username.length > 0){
      const searchedUser = await User.findOne({ name: req.body.username });
      query.User_ID = searchedUser._id ? searchedUser._id : null
    }else{
      let followed = []
      req.user.followed.forEach(element => {
        followed.push({User_ID : element.User_ID})
      });
      if(followed.length === 0){
        return res.send({ success: true , posts : [] , followed : false })
      }
      query.$or = followed;
    }
    const sort = req.body.sort ? -1 : 1
    Post.find(query).sort( { Post_Date : sort } ).skip(req.body.page).limit(6).then(async (docs) => {
      let arr = [];
      let followed = false;
      for (let doc of docs){
          let temp = {...doc._doc};
          const Content_ID = doc._id;
          const user = await User.findOne({ _id: doc.User_ID });
          const index = doc.Interaction.findIndex(
            item => item.User_ID.equals(req.user._id)
          )
          let userInteracted = 0;
          if(index > -1){
            userInteracted = doc.Interaction[index].Action
          }
          const Users_Agree = doc.Interaction.filter((interact)=> interact.Action === 1).length;
          const Users_DisAgree = doc.Interaction.filter((interact)=> interact.Action === 2).length

          const Comments_Count = await Post.find({Parent_ID : Content_ID});
          temp.sameUser = doc.User_ID.equals(req.user._id);
          temp.prof = { name : user.name };
          temp.userInteracted = userInteracted;
          temp.agreeAmount = Users_Agree;
          temp.disAgreeAmount = Users_DisAgree;
          temp.commentsCount = Comments_Count.length;
          arr.push(temp)
      }
        if(req.body.username && req.body.page == 0){
          const user = await User.findOne({ _id : req.user._id });
          const user2 = await User.findOne({ name : req.body.username });
          
          const index = user.followed.findIndex(
            item => item.User_ID.equals(user2._id)
          )
          if(index > -1) followed = true;
        }
        return {posts : arr , followed };
      }).then((data)=>{
        res.send({ success: true , ...data })
      }).catch(err =>{
        res.send({ success: false })
      });

})

router.post("/interact", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(!req.body.contentID) return;
    if(req.body.opinion !== 1 && req.body.opinion !== 2) return;
    // if(req.body.opinion)
    const Content_ID = req.body.contentID ? mongoose.Types.ObjectId(req.body.contentID) : null
    const query = {
      _id : Content_ID
   }
    Post.findOne(query).then(async (doc) => {
        const post = await Post.findOne(query);
        const index = post.Interaction.findIndex(
          item => item.User_ID.equals(req.user._id)
        )
        if(index > -1){
          const action  = post.Interaction[index].Action;
          if(action === req.body.opinion) req.body.opinion = 0;
          post.Interaction[index].Action = req.body.opinion
        }else{
          post.Interaction.push({
            User_ID: req.user._id,
            Action: req.body.opinion,
          })
        }
        await post.save();

        const postAgree = post.Interaction.filter((interact)=> interact.Action === 1).length;
        const postDisagree = post.Interaction.filter((interact)=> interact.Action === 2).length

        return { postAgree, postDisagree, Content_ID };
      }).then((data)=>{
        res.send({ success: true , opinion : req.body.opinion , ...data })
      }).catch(err =>{
        res.send({ success: false })
      });
})
router.post("/edit", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(!req.body.contentID) return;
    if(!req.body.text || req.body.text.trim().length == 0) return;
    const Content_ID = req.body.contentID ? mongoose.Types.ObjectId(req.body.contentID) : null
    Post.updateOne({ _id : Content_ID, User_ID : req.user._id  }, 
      { $set: { Post_Text : req.body.text.trim() , Post_Edited : true } }
      ).then(async (doc) => {

      }).then((data)=>{
        res.send({ success: true })
      }).catch(err =>{
        res.send({ success: false })
      });
})
router.post("/delete", verifyUser, async (req, res, next) => {
  if(!req.user._id) return;
  if(!req.body.contentID) return;
  const Content_ID = req.body.contentID ? mongoose.Types.ObjectId(req.body.contentID) : null
  Post.updateOne({ _id : Content_ID , User_ID : req.user._id }, 
    { $set: { Post_Flag : "inactive"  } }
    ).then(async (doc) => {

    }).then((data)=>{
      res.send({ success: true })
    }).catch(err =>{
      res.send({ success: false })
    });
})

module.exports = router