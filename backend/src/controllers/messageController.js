import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { uploadImageFromBuffer } from '../middlewares/uploadMiddleware.js';
import { uploadFileToSupabaseS3 } from '../libs/supabaseS3.js';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.js';
import { io } from '../socket/index.js';

export const uploadMessageImage = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!file.mimetype?.startsWith('image/')) {
            return res.status(400).json({ message: 'Only image uploads are allowed' });
        }

        const result = await uploadImageFromBuffer(file.buffer, {
            folder: 'midi_app/messages',
            transformation: [{ width: 1280, height: 1280, crop: 'limit' }],
        });

        return res.status(200).json({
            imgUrl: result.secure_url,
            imgId: result.public_id,
        });
    } catch (error) {
        console.error('Error uploading message image:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadMessageFile = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (file.mimetype?.startsWith('image/')) {
            return res.status(400).json({ message: 'Please use image upload for image files' });
        }

        const result = await uploadFileToSupabaseS3({
            buffer: file.buffer,
            originalName: file.originalname,
            mimetype: file.mimetype,
        });

        return res.status(200).json({
            file: {
                url: result.url,
                key: result.key,
                name: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
            },
        });
    } catch (error) {
        console.error('Error uploading message file:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const sendDirectMessage = async(req, res) => {

    try {

        const { recipientId, content, imgUrl, file, conversationId } = req.body;

        const senderId = req.user.id;

        let conversation;

        if (!content && !imgUrl && !file){
            return res.status(400).json({ message: 'Message content, image, or file is required' });
        }

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation) {
            conversation = await Conversation.create({
                type: 'direct',
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
        }


        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
            imgUrl,
            file,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);

        await conversation.save();
        emitNewMessage(io, conversation, message);

        res.status(201).json({ message: 'Message sent successfully', message });





        
    } catch (error) {
        console.error('Error sending direct message:', error);
        res.status(500).json({ message: 'Internal server error' });
        
    }
};


export const sendGroupMessage = async(req, res) => {
    try {
        const {conversationId, content, imgUrl, file} = req.body;
        const senderId = req.user.id;
        const conversation =  req.conversation;

        if (!content && !imgUrl && !file){
            return res.status(400).json({ message: 'Message content, image, or file is required' });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
            imgUrl,
            file,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);

        await conversation.save();

        emitNewMessage(io, conversation, message);
        res.status(201).json({ message: 'Message sent successfully', message });

        
    } catch (error) {
        console.error('Error sending group message:', error);
        res.status(500).json({ message: 'Internal server error' });
        
    }
};
