import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

//Method or route handler Function
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
    console.log("Full name is:", fullname)

    //validation
    if ([fullname, email, username, password].some((feild) =>
        feild?.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }

    //user existence
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User already Exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    //Upload on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
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

    //response
    // return res.status(201).json()
    return res.status(201).json(
        ApiResponse(200, createdUser, "User Registered successfully!!")
    )

})


export { registerUser }

