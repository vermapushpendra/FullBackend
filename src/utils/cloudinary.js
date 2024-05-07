import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

});

const uploadCloudinary = async (localFilePath) => {
    try {
        if (localFilePath) return null;
        //else Upload file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

        //file has been successfully upload
        console.log("File is uploaded succesfully on cloudinary", response.url);
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }

}

export {uploadCloudinary}