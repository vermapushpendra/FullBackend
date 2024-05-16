import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        channel: {
            type: Schema.Types.ObjectId, //one who has channel
            ref: "User",
            required: true
        },

        subscriber: {
            type: Schema.Types.ObjectId, //one who is subscribing
            ref: "User",
            required: true
        },


    }, { timestamps: true }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)