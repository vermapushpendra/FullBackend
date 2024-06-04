import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({

    video: {
        type: String, //Cloudinary URL
        required: true,

    },
    thumbnail: {
        type: String, //cloudinary URL
        required: true,

    },
    title: {
        type: String,
        required: true,

    },
    description: {
        type: String,
        required: true,

    },
    duration: {
        type: Number, //Cloudinary
        required: true,

    },

    publicId: {
        type: String, //cloudinary

    },
    views: {
        type: Number,
        default: 0

    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);

