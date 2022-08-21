const express = require("express")
const router = express.Router()
const Post = require("../models/post")
const User = require("../models/user")
const Interaction = require("../models/interaction")

const {
    verifyUser,
  } = require("../authenticate")

router.post("/create", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(req.body.contentID && req.body.title) return;
    if(req.body.title && req.body.title.trim().length == 0) return;
    if(!req.body.contentID && !req.body.title) return;
    if(!req.body.text || req.body.text.trim().length == 0) return;

    const post = new Post({
        Parent_ID : req.body.contentID.trim(),
        Post_Title : req.body.title.trim(),
        Post_Text : req.body.text.trim(),
        User_ID : req.user._id,
        Post_Date : Date.now(),
        Post_Flag : "active",
        Post_MediaUrl : "",
        Post_MediaFiles : "",
        Post_MediaFolder : "",
    });
    const result = await post.save();
    if(result._id){
        let temp = {...post._doc}
        temp._id = result._id;
        temp.sameUser = true;
        temp.prof = { name : req.user.name };
        temp.userInteracted = 0;
        temp.agreeAmount = 0;
        temp.disAgreeAmount = 0;
        temp.commentsCount = 0;
        res.send({ success: true , post : temp })
    }else{
        res.send({ success: false })
    }
})

router.post("/fetch", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    let query = { Parent_ID : req.body.parentID , Post_Flag : "active" };
    if(req.body.username && req.body.username.length > 0){
      const searchedUser = await User.findOne({ name: req.body.username });
      searchedUser._id ? query.User_ID = searchedUser._id : null
    }
    const sort = req.body.sort ? -1 : 1
    Post.find(query).sort( { Post_Date : sort } ).then(async (docs) => {
        let arr = [];
        let id = req.user._id.toString();
        for (let doc of docs){
            let temp = {...doc._doc};
            const Content_ID = doc._id.toString();
            const user = await User.findOne({ _id: doc.User_ID });
            const User_Interacted = await Interaction.findOne({User_ID : id, Content_ID});
            const Users_Agree = await Interaction.find({Content_ID , Action : 1});
            const Users_DisAgree = await Interaction.find({Content_ID , Action : 2});
            const Comments_Count = await Post.find({Parent_ID : Content_ID});

            temp.sameUser = doc.User_ID === id;
            temp.prof = { name : user.name };
            temp.userInteracted = User_Interacted ? User_Interacted.Action : 0;
            temp.agreeAmount = Users_Agree.length;
            temp.disAgreeAmount = Users_DisAgree.length;
            temp.commentsCount = Comments_Count.length;
            arr.push(temp)
        }
        return arr;
      }).then((posts)=>{
        res.send({ success: true , posts })
      }).catch(err =>{
        res.send({ success: false })
      });

})

router.post("/interact", verifyUser, async (req, res, next) => {
    if(!req.user._id) return;
    if(!req.body.contentID) return;
    if(req.body.opinion !== 1 && req.body.opinion !== 2) return;
    if(req.body.opinion)
    Post.findOne({ _id : req.body.contentID }).then(async (doc) => {
        const id = req.user._id.toString();
        const interaction = await Interaction.findOne({User_ID : id , Content_ID : req.body.contentID});
        if(interaction){
          if(interaction.Action === req.body.opinion) req.body.opinion = 0;
            await Interaction.updateOne({User_ID : id, Content_ID : req.body.contentID},{ $set: { Action : req.body.opinion } })
        }else{
            const interact = new Interaction({
                Content_ID: req.body.contentID,
                User_ID: id,
                Action: req.body.opinion,
            });
            await interact.save();
        }
        const Users_Agree = await Interaction.find({Content_ID : doc._id.toString() , Action : 1});
        const Users_DisAgree = await Interaction.find({Content_ID : doc._id.toString() , Action : 2});
        const temp = { postAgree : Users_Agree.length , postDisagree : Users_DisAgree.length , Content_ID :  doc._id.toString() }
        return temp;
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
    if(req.body.title && req.body.title.trim().length == 0) return;
    if(req.body.title.trim().length == 0) req.body.title = null
    
    Post.updateOne({ _id : req.body.contentID, User_ID : req.user._id  }, 
      { $set: { Post_Text : req.body.text.trim() , Post_Title : req.body.title.trim()  } }
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
  
  Post.updateOne({ _id : req.body.contentID , User_ID : req.user._id }, 
    { $set: { Post_Flag : "inactive"  } }
    ).then(async (doc) => {

    }).then((data)=>{
      res.send({ success: true })
    }).catch(err =>{
      res.send({ success: false })
    });
})

module.exports = router