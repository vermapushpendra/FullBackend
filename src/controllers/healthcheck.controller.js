import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json({ status: "Ok", message: "System is healthy !" })
})

export {
    healthcheck
}