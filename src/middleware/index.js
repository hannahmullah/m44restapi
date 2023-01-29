const bcrypt = require("bcrypt");
const { request, response } = require("express");
const User = require("../user/userModel");
const userRouter = require("../user/userRoutes");

exports.hashPass = async (request, response, next) => {
    try {
        /* take a pword out of a body, hash (encrypt) it using brcypt and then put back the encrypted pword to overwrite 
        the unencrypting pword and then pass on the updated body to the next function */
        const passwordCopy = request.body.password;
        const hashedPass = await bcrypt.hash(passwordCopy, 8);
        /*first parameter of hash is the plain text password to be enrypted. the second paramter is the 'salt' which is the amount
        of encrypted list carried out. more salt gives better encryption but takes longer */
        request.body.password = hashedPass;
        /* here we overwrite the unencrypted password with the encrypted  version*/
        next();
        //is the next middleware fuction to be evoked
    } catch (error) {
        console.log(error);
        response.status(500).send({ error: error.message })
    }
}

exports.comparePass = async (request, response, next) => {
    try {
        request.user = await User.findOne({ username: request.body.username }) //if this fails it means username was wrong
        //this pulls the user info from the database including hashed password
        const passCheck = await bcrypt.compare(request.body.password, request.user.password) //if this fails then password is wrong
        //this compares the unhashed password in the request body to the hashed password we stored in the request.user
        if (request.user && passCheck) {
            console.log("username exists and password is correct")
            next();
        } else {
            throw new Error("incorrect username or password")
        }



    } catch (error) {
        console.log(error)
        response.status(401).send({ error: error.message })
    }
}

exports.tokenCheck = async (request, response, next) => {
    try {
        if (!request.header("Authorization")) {
            console.log("No Authorization section in header")
            throw new Error("No token passed")
        }
        const token = request.header("Authorization").replace("Bearer ", "")
        console.log(token);
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findById(decodedToken._id);
        console.log(user);
        if (user) {
            request.user = user;
            next();
        } else {
            throw new Error("user not authorized")
        }
    } catch (error) {
        console.log(error)
        response.status(500).send({ error: error.message })
    }
}