import { mongoose, isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from 'cloudinary';


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    //Validation for empty input
    if ([title, description].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required or not be empty !")
    }

    //upload video
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required !")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required !")
    }

    //on Cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(400, "Error while uploading Video on cloudinary")
    }

    if (!thumbnailFile) {
        throw new ApiError(400, "Error while uploading Thumbnail on cloudinary")
    }

    //create object and send on video collection DB
    const video = await Video.create({
        video: videoFile.url,
        thumbnail: thumbnailFile.url,
        publicId: videoFile.public_id,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id,
    })

    const videoUploaded = await Video.findById(video?._id).select("-video -thumbnail -views -isPublished")

    if (!videoUploaded) {
        throw new ApiError(500, "Video is not Uploaded !")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoUploaded, "Video Uploaded sucessfully !")
        )

})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "title", sortType = "ascending", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pageNumber = parseInt(page)
    const pageLimit = parseInt(limit)
    const skip = (pageNumber - 1) * pageLimit
    const sortdirection = sortType === "ascending" ? 1 : -1

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "usedId is not found, userId is required !")
    }

    try {
        const videos = await Video.aggregate(
            [
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
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: pageLimit
                },
                {
                    $sort: { [sortBy]: sortdirection }
                }

            ])

        const totalVideos = await Video.countDocuments({ owner: userId })
        const totalPages = Math.ceil(totalVideos / pageLimit)

        return res
            .status(200)
            .json(
                new ApiResponse(200, { videos, totalPages, totalVideos }, "All videos fetched")
            )

    } catch (error) {
        throw new ApiError(400, "Error while fetching videos", error)
    }

})

//get video for watch the video
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not correct to find video")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video is not found or VideoId is not correct !")
    }


    //increment views of video
    const user = await User.findById(req.user?._id)

    if (!(user.watchHistory.includes(videoId))) {
        await Video.findByIdAndUpdate(videoId,
            {
                $inc: {
                    views: 1
                }
            },
            {
                new: true
            }
        )
    }

    ////set video_id in watchHistory of user

    await User.findByIdAndUpdate(req.user?._id,
        {
            $addToSet: {
                watchHistory: videoId
            }
        },
        {
            new: true
        }
    )

    //// just for testing
    // await User.findByIdAndUpdate(req.user?._id,
    //     {
    //         $set: {
    //             watchHistory: []
    //         }
    //     },
    //     {
    //         new: true
    //     }
    // )

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video is fetched by videoId")
        )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not correct to update video")
    }
    //TODO: update video details like title, description, thumbnail

    const video = await Video.findById(videoId)

    //previous video publicId
    const publicId = video.publicId

    if (!publicId) {
        throw new ApiError(400, "publicId is not present")
    }

    if (publicId) {
        //function call
        try {
            // await deleteOnCloudinary(publicId, { resource_type: 'video' })
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
        } catch (error) {
            throw new ApiError(400, "error while deleting video file from cloudinary to update video file")
        }
    }

    //upload and update new
    const videoLocalPath = req.file?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required please choose the file to update")
    }

    const newVideo = await uploadOnCloudinary(videoLocalPath)

    if (!newVideo.url) {
        throw new ApiError(400, "Error while uploading on cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                video: newVideo.url,
                publicId: newVideo.public_id,
                duration: newVideo.duration
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video Updated Sucessfully !")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not correct to delete video")
    }

    const video = await Video.findById(videoId)

    const publicId = video.publicId

    if (publicId) {
        //function call
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
        } catch (error) {
            throw new ApiError(400, "error while deleting video file from cloudinary")
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, [], "Video is deleted successfully !")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not correct to Toggle publish status of video")
    }

    //toggle the ispublished --> if true then false if false then true
    video.isPublished = !video.isPublished

    const publishStatus = await Video.findByIdAndUpdate(videoId,
        {
            isPublished: video.isPublished
        },
        {
            new: true
        }
    ).select("-video -thumbnail -title -description -views -duration -owner")

    return res
        .status(200)
        .json(
            new ApiResponse(200, publishStatus, "If your video was published then now unpublish And if It was unpublished then now published !")
        )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
