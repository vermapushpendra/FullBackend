import mongoose, { Schema } from mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    id:
    {
        type: Number,

    },

    videoFile: {
        type: String, //Cloudinary
        required: true,

    },
    thumbnail: {
        type: String,
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
    views: {
        type: Number,
        default: 0

    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);

