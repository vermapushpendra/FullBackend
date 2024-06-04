import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";


const getChannelStats = asyncHandler(async (req, res) => {

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(404, "requested user Id not found")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found with this User Id")
    }

    const totalSubscribers = await Subscription.countDocuments({ channel: req.user?._id })

    const totalVideos = await Video.countDocuments({ owner: req.user?._id })

    const totalVideosViews = await Video.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $match: {
                    views: {
                        $gt: 0
                    }
                }
            },
            {
                $group: {
                    _id: "$views",
                    totalViews: {
                        $sum: "$views"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalViews: 1
                }
            }
        ]
    )
    const totalVideos_Views = totalVideosViews[0]

    //Total Likes on Videos
    const totalVideosLikes = await Like.aggregate(
        [
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "allVideos",
                }
            },
            {
                $unwind: "$allVideos" //can use addFields->first also 
            },
            {
                $match: {
                    "allVideos.owner": new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $group: {
                    _id: null,  //means Single group
                    totalVideosLikes: {
                        $sum: 1 //count all the Input Documents in pipeline
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalVideosLikes: 1
                }
            },
        ]
    )
    const totalCommentsLikes = await Like.aggregate(
        [
            {
                $lookup: {
                    from: "comments",
                    localField: "comment",
                    foreignField: "_id",
                    as: "allComments",
                }
            },
            {
                $unwind: "$allComments" //can use addFields->first also 
            },
            {
                $match: {
                    "allComments.owner": new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $group: {
                    _id: null,  //means Single group
                    totalCommentsLikes: {
                        $sum: 1 //count all the Input Documents in pipeline
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCommentsLikes: 1
                }
            },
        ]
    )

    // Total Likes for both Videos and Comments 
    const totalLikes = (totalVideosLikes[0].totalVideosLikes + totalCommentsLikes[0].totalCommentsLikes)

    const channelStats = [
        { totalSubscribers: totalSubscribers },
        { totalVideos: totalVideos },
        totalVideos_Views,
        totalVideosLikes[0],
        totalCommentsLikes[0],
        { totalLikes: totalLikes },
    ]

    return res
        .status(200)
        .json(
            new ApiResponse(200, channelStats, "Stats fetched sucessfully!")
        )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

})

export {
    getChannelStats,
    getChannelVideos
}