import { asyncHandler } from "../utils/asyncHandler.js";

//Method or route handler Function
const registerUser = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        message: "Code Running Perfectly"
    })
})

export {registerUser}

