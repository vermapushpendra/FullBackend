import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

const addComment = asyncHandler(async (req, res) => {


})

const getVideoComments = asyncHandler(async (req, res) => {

})


const updateComment = asyncHandler(async (req, res) => {

})


const deleteComment = asyncHandler(async (req, res) => {

})


export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}


