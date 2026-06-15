import express from 'express';
import { authMe, searchUserbyUsername, uploadAvatar, updateProfile, updatePreferences, changePassword, deleteAccount } from '../controllers/userController.js';
import {upload} from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserbyUsername);
router.post("/uploadAvatar", upload.single('file'), uploadAvatar);
router.put("/update", updateProfile);
router.put("/preferences", updatePreferences);
router.put("/change-password", changePassword);
router.delete("/delete-account", deleteAccount);


export default router;