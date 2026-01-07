import express from 'express';
import { authMe, searchUserbyUsername } from '../controllers/userController.js';


const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserbyUsername);


export default router;