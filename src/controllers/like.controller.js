import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video Id is not available")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found with this video Id or Invalid video Id")
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const isLiked = await Like.findOne({ video: videoId, likedBy: user?._id })

    let videolikeStatus;
    try {
        if (!isLiked) {
            await Like.create({
                video: videoId,
                likedBy: user?._id
            })

            videolikeStatus = { isLiked: true }
        }
        else {
            await Like.deleteOne(isLiked._id)
            videolikeStatus = { isLiked: false }
        }

    } catch (error) {
        throw new ApiError(400, "Error while toggle video like", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videolikeStatus, "Video Like Toggle sucessfully")
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "commentId is not available")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found with this commentId or Invalid commentId")
    }

    if (!req.user?._id) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const isLiked = await Like.findOne({ comment: commentId, likedBy: user?._id })

    let commentlikeStatus;
    try {
        if (!isLiked) {
            await Like.create({
                comment: commentId,
                likedBy: user?._id
            })

            commentlikeStatus = { isLiked: true }
        }
        else {
            await Like.deleteOne(isLiked._id)
            commentlikeStatus = { isLiked: false }
        }

    } catch (error) {
        throw new ApiError(400, "Error while toggle comment like", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, commentlikeStatus, "Comment Like Toggle sucessfully")
        )
})

//Videos Liked By the Current User 
const getLikedVideos = asyncHandler(async (req, res) => {

    if (!req.user?._id) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!isValidObjectId(user)) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const likedVideos = await Like.aggregate(
        [
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $match: {
                    video: {
                        $exists: true
                    }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
                    pipeline: [
                        {
                            $project: {
                                video: 1,
                                thumbnail: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                owner: 1,
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
                                    $first: "$owner"
                                }
                            }
                        },

                    ]
                }
            }
        ]
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "All liked Videos fetched sucessfully")
        )
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}