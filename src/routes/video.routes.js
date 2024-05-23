import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router()
//using middleware
router.use(verifyJWT)

router.route("/")
    .get(getAllVideos)
    .post(upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), publishAVideo)

router.route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("video"), updateVideo)
    .delete(deleteVideo)

router.route("/toggle/publish/:videoId")
    .patch(togglePublishStatus)



export default router