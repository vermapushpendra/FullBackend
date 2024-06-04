import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not available !")
    }

    if (!req.user?._id) {
        throw new ApiError(400, "Invalid LoggedIn user Id  !")
    }

    const subscriberId = req.user?._id

    const isSubscribed = await Subscription.findOne(
        {
            channel: channelId,
            subscriber: subscriberId
        }
    )

    let subscriptionStatus;
    try {
        if (isSubscribed) {
            // await Subscription.findByIdAndDelete(isSubscribed._id)
            await Subscription.deleteOne({ _id: isSubscribed._id })
            subscriptionStatus = { isSubscribed: false }
        }
        else {
            await Subscription.create(
                {
                    channel: channelId,
                    subscriber: subscriberId
                }
            )
            subscriptionStatus = { isSubscribed: true }

        }

    } catch (error) {
        new ApiError(400, "Error while toggle subscription", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscriptionStatus, "Toggle Subscription Sucessfully !")
        )
})

// controller to return subscriber list of a channel
//Returning or showing the subscribers count in Channels on which user click

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid Channel ID!")
    }

    const userSubscribers = await Subscription.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId),
                }
            },
            //One More way to count subscribers without lookup            
            {
                $group: {
                    _id: null,
                    totalSubscribers: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalSubscribers: 1
                }
            }
        ]
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, userSubscribers[0] || { subscribers: 0 }, "Subscribers fetched sucessfully !")
        )
})

// controller to return channel list to which user has subscribed
//channel subscribed by current loggedin user

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(401, "Invalid subscriber Id!")
    }

    const userchannel = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscribedTo",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                isSubscribed: 1
                            }
                        }
                    ]
                }
            },

            {
                $addFields: {
                    subscribedTo: {
                        $first: "$subscribedTo"
                    }
                }
            }
        ]
    )

    const channelsList = userchannel.map(i => i.subscribedTo)

    return res
        .status(200)
        .json(
            new ApiResponse(200, channelsList, "subscribed channels fetched")
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}