import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId } = req.params

    if (!req.user?._id) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    if (content.trim() === "") {
        throw new ApiError(400, "content is required and should not be empty")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video Id is not available")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found with this video Id or Invalid video Id")
    }

    const comment = await Comment.create(
        {
            content: content,
            owner: req.user?._id,
            video: videoId
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment added Sucessfully!")
        )

})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video Id is not available")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found with this video Id or Invalid video Id")
    }

    const pageLimit = parseInt(limit)
    const pageNumber = parseInt(page)
    const offset = (pageNumber - 1) * pageLimit
    const skip = offset

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)  //i'll give all comments witht this videoId
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner" //return directly object not in array
                }
            }
        },
        {
            $skip: skip
        },
        {
            $limit: pageLimit
        }

    ])

    const totalComments = await Comment.countDocuments({ video: videoId })
    const totalPages = Math.ceil(totalComments / pageLimit)

    return res
        .status(200)
        .json(
            new ApiResponse(200, { comments, totalComments, totalPages }, "video all Comments fetched Sucessfully!")
        )

})


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { newcontent } = req.body

    if (newcontent.trim() === "") {
        throw new ApiError(400, "content is required and should not be empty")
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Video id or not available")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found with this comment Id")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content: newcontent
            }
        },
        {
            new: true
        }
    )

    if (!updatedComment) {
        throw new ApiError(400, "Error while updating Comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated or edited sucessfully")
        )

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Video id or not available")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found with this comment Id")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if (!deleteComment) {
        throw new ApiError(400, "Error while deleting comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deleteComment, "Comment delted Sucessfully !")
        )

})


export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}
