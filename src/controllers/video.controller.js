import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from 'cloudinary';

//delete files from cloudinary
const deleteFromCloudinary = async (publicId) => {
    console.log("publicid in deletefunc", publicId)
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
        throw new ApiError(500, "Error while Deleting file from Cloudinary", error)
    }
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "titl", sortType = "ascendingg", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if (!userId) {
        throw new ApiError(400, "usedId is not found, userId is required !")
    }

    try {
        const videos = await Video.find({ owner: userId })
            .sort({ [sortBy]: sortType })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return res
            .status(200)
            .json(
                new ApiResponse(200, videos, "All videos fetched")
            )

    } catch (error) {
        throw new ApiError(400, "videos not fetched", error)
    }

})

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
        throw new ApiError(400, "video is requied to upload on cloudinary")
    }

    if (!thumbnailFile) {
        throw new ApiError(400, "thumbnail is requied to upload on cloudinary")
    }

    //create object and send on video collection DB
    const video = await Video.create({
        video: videoFile.url,
        thumbnail: thumbnailFile.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
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

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video is not found or VideoId is not correct !")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video is fetched by videoId")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    //pevious video url -- Delete the previous file before the updation
    const video = await Video.findById(videoId)
    const previousVideoUrl = video.video

    if (previousVideoUrl) {
        // Extract the public ID from video URL
        const publicId = previousVideoUrl.split("/").pop().split(".")[0];
        //calling function
        deleteFromCloudinary(publicId)
    }

    //upload and update
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
    const video = await Video.findById(videoId)

    const previousVideoUrl = video.video

    if (previousVideoUrl) {
        // Extract the public ID from video URL
        const publicId = previousVideoUrl.split("/").pop().split(".")[0];
        //function call
        console.log("publicidd", publicId)
        deleteFromCloudinary(publicId)

    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, [], "Video is deleted successfully !")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video is not found")
    }

    //toggle the ispublished --> if true then false if false then true
    video.isPublished = !video.isPublished

    await Video.findByIdAndUpdate(videoId,
        {
            isPublished: video.isPublished
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, [], "If your video was published then now unpublish And if It was unpublished then now published !")
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
