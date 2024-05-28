import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js";
import { mongoose } from "mongoose";
import { v2 as cloudinary } from 'cloudinary';

//Method to delete the old files from the cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new ApiError(500, "Error while Deleting file from Cloudinary", error)
    }
}

//Method of generateAccessAndRefreshTokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        console.log("accessToken:", accessToken)

        user.refreshToken = refreshToken //set refresh token 
        await user.save({ validateBeforeSave: false }) //save into DB
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the access and refresh token")
    }

}

//Method or register function
const registerUser = asyncHandler(async (req, res, next) => {

    ////--- Steps for Register user ---
    //get user details from frontend
    //validation
    //check if user already exixts
    //check images, avatar
    //upload them on cloudinary
    //create user object -- create entry in db
    //remove password and refresh tokens from the response
    //check for user creation
    //return response


    //destructuring
    const { username, fullname, email, password } = req.body

    //validation --These value should not be empty
    if ([fullname, email, username, password].some((feild) =>
        feild?.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }

    //user existence
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already Exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    else {
        coverImageLocalPath = "";
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required (Path)");
    }

    //Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required to upload on Cloudinary")
    }

    //Create object and send in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //give Response with removed password and refreshTokens
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check user creation
    if (!createdUser) {
        throw new ApiError(500, "User is not created")
    }

    //response without pass and refeshToken
    // return res.status(201).json()
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdUser, "User Registered successfully!!")
        )

})


//Method to login
const loginUser = asyncHandler(async (req, res, next) => {
    //get data --> from the user
    const { username, email, password } = req.body;

    //username and email base
    if (!username && !email) {
        throw new ApiError(400, "username or email is required !")
    }

    //find the user
    const user = await User.findOne( //here actually when find the user so we will got the user object which contains username, emial, refreshToken... 
        {
            $and: [{ username }, { email }]
        }
    )

    //if user not found
    if (!user) {
        throw new ApiError(404, "User doesn't exist !, please signUp")
    }

    //if user found => authenticate password
    const isPasswordvalid = await user.isPasswordCorrect(password)

    //if wrong password
    if (!isPasswordvalid) {
        throw new ApiError(401, "password is Incorrect! please fill correct password")
    }

    //if password is correct => create access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id); //Destructuring here


    //remove password and refreshtoken => --for return to user
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log("loggendINuser details", loggedInUser)

    //send access and refresh token to user using Cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in Succesfully"
            )
        )


})


//Logout method
const logoutUser = asyncHandler(async (req, res, next) => {

    //removing refreshToken from the DB
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    //Clear cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User LoggedOut Successfully!"))

})

//RefreshAccessToken --> next Create endpoint in route
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies?.refreshToken

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        //decode the encrypted token
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET) //it will give payload object (id)

        // console.log("decoded refereshtoken", decodedToken)
        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refreshToken")
        }

        //if not match the refreshtoken
        if (incommingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "RefreshToken is expired or invalid!")
        }

        //if match the refreshtoken
        const options = {
            httpOnly: true,
            secure: true
        }

        const { newaccessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", newaccessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken: newaccessToken, refreshToken: newrefreshToken },
                    "AcessToken Refreshed Successfully !"
                )

            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

//Change password method
const changeUserPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User is not found")
    }

    //match the password --> encrypted password in db
    const isPasswordRight = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordRight) {
        throw new ApiError(400, "your old password is not correct")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "Your new password and old password is same, it should be different")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Your password is changed successfully!")
        )


})

//get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "User fetched Successfully")
        )

})

//update user details
const updateUserDetails = asyncHandler(async (req, res) => {

    const { fullname, email } = req.body

    if (!fullname && !email) {
        throw new ApiError(400, "feild cannot be")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                fullname, // can be written as well
                email: email
            }

        },
        {
            new: true  //Value will be return after the updation -- like after the username update
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User details Updated Successfully !")
        )
})

//update user file -- avatar
const updateAvatar = asyncHandler(async (req, res) => {

    //delete previous old images
    const previousAvatarUrl = req.user?.avatar

    if (previousAvatarUrl) {
        // Extract the public ID from avatar URL
        const publicId = previousAvatarUrl.split("/").pop().split(".")[0];
        //calling function
        deleteFromCloudinary(publicId)
    }

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "please choose the avatar, file path is not avialable")
    }

    const newavatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newavatar.url) {
        throw new ApiError(400, "Error while uploading avatar on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: newavatar.url
            }
        },

        {
            new: true
        }
    ).select("-password")




    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User avatar is updated successfully!")
        )
})

//update user file -- coverImage
const updateCoverImage = asyncHandler(async (req, res) => {

    //delete previous old images
    const previousCoverImageUrl = req.user?.coverImage

    if (previousCoverImageUrl) {
        // Extract the public ID from avatar URL
        const publicId = previousCoverImageUrl.split("/").pop().split(".")[0];
        //calling function
        deleteFromCloudinary(publicId)
    }

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "please choose the coverImage, file path is not avialable")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading CoverImage on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },

        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User CoverImage is updated successfully!")
        )
    //Perform that after upload old file will delete
})

//On click on Subscribe Button


//get user profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    console.log("user profile username", username)

    if (!username?.trim()) {
        throw new ApiError(400, "User is missing!")
    }


    //Aggregation
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },

            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedToChannel",
                }
            },

            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    subscribedToChannelCount: {
                        $size: "$subscribedToChannel"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribedToChannel.subscriber"]
                            },
                            then: true,
                            else: false,
                        }
                    }
                }
            },

            {
                $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    subscribedToChannelCount: 1,
                    createdAt: 1
                }
            }

        ]
    )

    // console.log("all channels details:", channel)
    if (!channel) {
        throw new ApiError(404, "channel is not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched Sucessfully!")
        )


})

//get Watch History
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",

                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",

                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        //pick first element of the array
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            },


        ]
    )

    if (!user) {
        throw new ApiError(400, "User is not found to getHistory")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "User watchHistory Fetched sucessfully!")
        )

})






export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}

