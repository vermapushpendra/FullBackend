import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

//Method of generateAccessAndRefreshTokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.schema.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken //set refresh token 
        await user.save({ validateBeforeSave: false }) //save into DB

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

    //Response with removed password and refreshTokens
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check user creation
    if (!createdUser) {
        throw new ApiError(500, "User is not created")
    }

    //response without pass and refeshToken
    // return res.status(201).json()
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully!!")
    )

})


//Method to login
const loginUser = asyncHandler(async (req, res, next) => {
    //get data
    const { username, email, password } = req.body;

    //username and email base
    if (!username || !email) {
        throw new ApiError(400, "username or email is required !")
    }

    //find the user
    const user = await User.findOne( //here actually when find the user so we will got the user object which contains username, emial, refreshToken... 
        {
            $or: [{ username }, { email }]
        }
    )

    //if user not found
    if (!user) {
        throw ApiError(404, "User doesn't exist !, please signUp")
    }

    //if user found => authenticate password
    const isPasswordvalid = await user.isPasswordcorrect(password)

    //if wrong password
    if (!isPasswordvalid) {
        throw ApiError(401, "password is Incorrect! please fill correct password")
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
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    //Clear cookie
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



export {
    registerUser,
    loginUser,
    logoutUser
}

