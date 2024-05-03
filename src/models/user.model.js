import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        fullname:
        {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:
        {
            type: String, //cloudinary
            required: true,

        },
        coverImage:
        {
            type: String, //cloudinary
        },
        watchHistory: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        password: {
            type: String,
            required: [true, "Password is required !"]
        },
        refreshToken: {
            type: String
        }

    },
    { timestamps: true }
);

//pre hook for bcrypt
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next();

});

//password match method
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password); //return the boolean value
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expireIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expireIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema);