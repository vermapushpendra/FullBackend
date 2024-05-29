import { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router()
router.use(verifyJWT) //middleware

router.route("/").post(createPlaylist)

router.route("/user/:userId").get(getUserPlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/:playlistId")
    .patch(updatePlaylist)
    .delete(deletePlaylist)

export default router;