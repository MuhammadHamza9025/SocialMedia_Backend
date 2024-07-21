const mongoose = require('mongoose')
const express = require('express')
const app = express()
const cors = require('cors')
const Users = require('./Models/models')
const Posts = require('./Models/Post')
const jwt = require("jsonwebtoken")
const path = require('path')
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const multer = require('multer')
app.use('/images', express.static('upload/images'))

const port = 9000;

const storage = multer.diskStorage({
    destination: 'upload/images', // Assuming 'uploads' is in the root of your project
    filename: (req, file, cb) => {
        return cb(null, `${file.originalname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});
const uploadfile = multer({ storage: storage });
app.post('/upload', uploadfile.single('image'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

app.use(cors())
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))


// mongoose.connect('mongodb://127.0.0.1:27017/Authentication')
mongoose.connect("mongodb+srv://Hamza:2vFfwKwATPXWmJy8@social.0drhd5s.mongodb.net/Authentication")
    .then(console.log('Databse craeted')).catch((err) => console.log(err))



app.post('/signup', uploadfile.single('image'), async (req, res) => {
    const { name, email, password } = req.body;
    console.log(req.body)
    if (!name || !email || !password) {
        res.json({ error: "Please complete all Fields" })
    }
    else {

        const search_for_existing_email = await Users.findOne({ email });
        if (search_for_existing_email) {
            res.json({ success: false, error: "Email Already in Use." })
        }
        else {

            res.json({ success: true, message: "Account Created" })
            const database = await Users.create({
                name,
                email,
                password,
                id: Date.now(),
                city: {},
                country: {},
                url: {},
                image: '',
                followers: [],
                following: [],
                interests: [],
            })

            //Geenerating a Web Token for Verificatio
            const data = { id: database.id }
            const token = jwt.sign(data, 'hamzahamzahamza')

        }
    }
})


/// Login users functionality using middleware
let get_email;
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    get_email = await Users.findOne({ email })
    if (!get_email) {
        res.json({ success: false, error: 'Email not exists.' })

    }

    else {
        const truepwd = await bcrypt.compare(password, get_email.password);
        console.log(truepwd)

        if (truepwd) {
            const data = { get_email: { _id: get_email._id } }

            const token = jwt.sign(data, 'hamzahamzahamza')

            // secure: true, // Ensure cookie is only transmitted over HTTPS


            res.status(200).json({ success: true, message: "Login Sucessfully", token: token, data: get_email })



        }
        else {
            res.json({ success: false, error: "Password wrong" })

        }
    }

})


//middleware for verifying users

const usermiddleware = async (req, res, next) => {
    const token = req.header("auth-token");


    if (!token) {
        res.status(401).json({ message: "Please Authenticate token" });
    }
    else {

        const data = jwt.verify(token, 'hamzahamzahamza')




        req.get_email = data.get_email;


        next()


    }

}

app.get('/login', usermiddleware, async (req, res) => {

    const finds = await Users.findOne({ _id: req.get_email._id })
    // console.log(finds)
    res.json(finds)

})

app.post('/post', uploadfile.single('image'), usermiddleware, async (req, res) => {
    const { title, desc, image } = req.body
    console.log(title, desc)
    const post = new Posts({
        title,
        desc,
        image: `http://localhost:${port}/images/${req.file.filename}`,
        postedby: req.get_email._id,
        likedby: [],
        comment: []

    })
    post.save()
    const getall = await Posts.find()
    res.json(getall)

})


app.get('/mypost', usermiddleware, async (req, res) => {
    const getallpr = await Posts.find({ postedby: req.get_email._id }).populate("postedby")
    res.json(getallpr)
})

app.post('/user/:id', usermiddleware, async (req, res) => {

    const id = req.params.id

    ////
    const getuser = await Users.findOne({ _id: id })
    const get = await Posts.find({ postedby: getuser._id })
    const get_user = await Users.findOne({ _id: req.get_email._id })
    console.log(getuser._id)
    const check = get_user.following.includes(id)

    res.json({ userdetails: getuser, posts: get, check })


})
///////////////////////getall users for search purpose

app.get('/getallusers', async (req, res) => {

    const getall = await Users.find()

    getall.followers = undefined;
    getall.password = undefined;
    getall.posts = undefined;
    getall.following = undefined;

    res.json(getall)

})


app.post('/getlikes', usermiddleware, async (req, res) => {



    const finduserlikedornot = await Posts.findOne({ _id: req.body.id, likedby: req.get_email._id })

    if (finduserlikedornot) {
        res.json({ success: false, error: "alredy liked" })

    }
    else {
        const updatelikes = await Posts.findOneAndUpdate({ _id: req.body.id }, { $push: { likedby: req.get_email._id } }, { new: true })
        res.json({ success: true, message: "Post Liked" })
    }

})
app.post('/getcomment', usermiddleware, async (req, res) => {
    const { post, id } = req.body
    const get_user = await Users.findOne({ _id: req.get_email._id })
    if (!post) {
        res.json({ success: false, error: "Comment Should not be empty" })
    }
    else {
        const updatelikes = await Posts.findOneAndUpdate({ _id: id }, { $push: { comment: { user: get_user, text: post } } }, { new: true })
        res.json({ success: true, message: "Comment Posted Successfully", updatelikes })
    }


})



app.post('/otherusers', usermiddleware, async (req, res) => {

    const allusers = await Users.find({ _id: { $ne: req.get_email._id } }).limit(10)
    // const me = await Users.findOne({ _id: req.get_email._id })

    res.json(allusers)
})





///////////////Edit profile image

// app.post('/profileedit', uploadfile.single('image'), usermiddleware, async (req, res) => {
//     const edit = await Users.findByIdAndUpdate({ _id: req.get_email._id }, { image: `http://localhost:${port}/images/${req.file.filename}` }, { new: true })
//     console.log(`http://localhost:${port}/images/${req.file.filename}`)

// })


app.post('/profileedit', uploadfile.single('image'), usermiddleware, async (req, res) => {
    try {
        const edit = await Users.findByIdAndUpdate(
            req.get_email._id, // Assuming _id is a string or ObjectId
            { image: `http://localhost:${port}/images/${req.file.filename}` },
            { new: true }
        );
        res.send('Profile image updated successfully');
    } catch (error) {
        res.status(500).send('Error updating profile image');
    }
});

app.post('/interests', usermiddleware, async (req, res) => {
    const edit_int = await Users.findByIdAndUpdate({ _id: req.get_email._id }, { $push: { interests: req.body.interests } }, { new: true })
})








/////////////Follow and unfollow

app.post('/follow', usermiddleware, async (req, res) => {
    const { id } = req.body;

    try {
        // Check if the user is already following
        const findfollower = await Users.findOne({ _id: id, followers: req.get_email._id });

        if (findfollower) {
            const follow_user = await Users.findByIdAndUpdate({ _id: id }, { $pull: { followers: req.get_email._id } }, { new: true });
            const following_user = await Users.findByIdAndUpdate({ _id: req.get_email._id }, { $pull: { following: id } }, { new: true });

            return res.json({ success: false, message: "Already Following" });
        } else {
            // If the user is not already following, update both users
            const follow_user = await Users.findByIdAndUpdate({ _id: id }, { $push: { followers: req.get_email._id } }, { new: true });
            const following_user = await Users.findByIdAndUpdate({ _id: req.get_email._id }, { $push: { following: id } }, { new: true });

            // Return success message
            return res.json({ success: true, message: 'Following' });
        }
    } catch (error) {
        // If an error occurs during the database operation, return an error message
        return res.status(500).json({ success: false, message: "An error occurred" });
    }
});


// app.get('/folowtext', usermiddleware, async (req, res) => {
//     const findfollower = await Users.findOne({ _id: id }, { followers: req.get_email._id })
//     if (findfollower) {
//     }


// })


// app.get('/post', usermiddleware, async (req, res) => {
//     const posts = await Users.findOne({ _id: req.get_email._id })
//     // console.log(posts.followers)

//     const getallpr = await Posts.find({ postedby: req.get_email._id }).populate("postedby")
//     const all = await Users.find({ _id: posts.following || { _id: posts.followers } })
//     const allp = await Posts.find({ postedby: all }).populate("postedby")
//     res.json(getallpr.concat(allp))
//     // console.log(getallpr)

// })



app.get('/post', usermiddleware, async (req, res) => {
    try {
        const posts = await Users.findOne({ _id: req.get_email._id });

        // Array to store IDs of users to fetch posts from
        let usersToFetchPostsFrom = [req.get_email._id]; // Start with the current user

        if (posts.following && posts.following.length > 0) {
            // Add IDs of users the current user is following
            usersToFetchPostsFrom = usersToFetchPostsFrom.concat(posts.following);
        }

        if (posts.followers && posts.followers.length > 0) {
            // Add IDs of users following the current user
            usersToFetchPostsFrom = usersToFetchPostsFrom.concat(posts.followers);
        }

        // Find posts from the usersToFetchPostsFrom array
        const allPosts = await Posts.find({ postedby: { $in: usersToFetchPostsFrom } }).populate("postedby");

        res.json(allPosts);
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred" });
    }
});



/////////////////////Contact Info

app.post('/contact', usermiddleware, async (req, res) => {
    const { city, country, link, email } = req.body;
    if (city && country && link) {
        const updatecon = await Users.findByIdAndUpdate({ _id: req.get_email._id }, { city, country, url: link }, { new: true })

    }
    else {
        res.json('Please  fill out the required fields')
    }

})

app.post('/deleteposts', usermiddleware, async (req, res) => {
    const { id } = req.body

    const getlogineduser = await Users.findOne({ _id: req.get_email._id })
    const getpost = await Posts.findByIdAndDelete({ _id: id, postedby: getlogineduser }).then(() => console.log('object'))

})



app.listen(port, () => console.log("running of port 9000"))

