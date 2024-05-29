import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    const checkPlaylist = await Playlist.findOne({ name, description })

    if (checkPlaylist) {
        throw new ApiError(400, "Playlist with this name is already available")
    }

    if (!(name || description)) {
        throw new ApiError(400, "name and description is required")
    }

    if ([name, description].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400, "Name of Playlist and Description should not be Empty")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "User Id is not available")
    }

    const playlist = await Playlist.create(
        {
            name: name,
            description: description,
            owner: req.user._id
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist Created Sucessfully")
        )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(playlistId || video)) {
        throw new ApiError(400, "playlistId and videoId is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video is not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "playlistId is not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if (!updatedPlaylist) {
        throw new ApiError(404, "Error while Adding video to playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "video added to the playlist")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!(playlistId || video)) {
        throw new ApiError(400, "playlistId and videoId is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video is not found with this videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "playlistId is not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $unset: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if (!updatedPlaylist) {
        throw new ApiError(404, "Error while removing video to playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "video removed sucessfully from the playlist")
        )
})

const getUserPlaylist = asyncHandler(async (req, res) => {
    const { userId } = req.params


    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid User Id")
    }

    const userPlaylist = await Playlist.aggregate(
        [
            //for owner of playlist
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
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
                                _id: 1,
                                username: 1,
                                fullname: 1,
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
            //for videos of playlist
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                video: 1,
                                thumbnail: 1,
                                title: 1,
                                views: 1,
                                owner: 1
                            }
                        },
                        //for owner of videos
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            fullname: 1,
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
                        }

                    ]
                }
            },
            {
                $addFields: {
                    videos: {
                        $first: "$videos"
                    }
                }
            }

        ]
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, userPlaylist, "User playlist is fetched sucessfully")
        )

})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) {
        throw new ApiError(400, "Error while updating name and description of playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist name and description updated sucessfully")
        )

})


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "playlistId is required")
    }

    const userPlaylist = await Playlist.findById(playlistId)

    const playlistDelete = await Playlist.deleteOne({ name: userPlaylist.name, description: userPlaylist.description })

    if (!playlistDelete) {
        throw new ApiError(400, "Error while deleting playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlistDelete, "Playlist deleted sucessfully")
        )

})


export {
    createPlaylist,
    getUserPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
}