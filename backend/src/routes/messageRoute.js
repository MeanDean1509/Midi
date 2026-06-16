import express from 'express';
import { sendDirectMessage, sendGroupMessage, uploadMessageFile, uploadMessageImage } from '../controllers/messageController.js';
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js';
import { upload, uploadFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/upload-image', upload.single('file'), uploadMessageImage);
router.post('/upload-file', uploadFile.single('file'), uploadMessageFile);

router.post('/direct',checkFriendship, sendDirectMessage);

router.post('/group', checkGroupMembership, sendGroupMessage);


export default router;
