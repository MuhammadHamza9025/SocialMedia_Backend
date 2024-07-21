const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

const Schema = new mongoose.Schema({
    desc: {
        type: String,

    },
    title: {
        type: String,

    },
    image: {
        type: String,

    },
    postedby: {
        type: ObjectId,
        ref: "Users"
    },
    likedby: [{
        type: ObjectId,
        ref: "Users"
    }],
    comment:
        [{
            text: String,
            user: {}
        }],

});
const Posts = mongoose.model('Posts', Schema)

module.exports = Posts;