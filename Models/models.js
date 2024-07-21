const mongoose = require('mongoose')
const Validator = require("Validator")
const bcrypt = require('bcrypt')



const Schema = new mongoose.Schema({

    name: {
        type: String,
        // required: [true, 'Please Enter your Name']
    },
    email: {
        type: String,
        // required: [true, 'Email is required'],
    },
    image: {
        type: String
    },
    cover: {
        type: String
    },
    password: {
        type: String,
        // required: [true, 'Password is required']

    },
    following: {},
    followers: {},
    interests: [{}],

    token: {

    },
    city: {
    },
    country: {

    },
    url: {

    },
    id: {}
})
////////////

Schema.pre('save', async function (next) {
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

const Users = mongoose.model('Users', Schema)

module.exports = Users;