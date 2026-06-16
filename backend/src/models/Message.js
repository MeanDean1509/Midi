import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true, 
        },
        content: {
            type: String,
            trim: true,
        },
        imgUrl: {
            type: String,
        },
        file: {
            url: { type: String },
            key: { type: String },
            name: { type: String },
            size: { type: Number },
            mimeType: { type: String },
        },

    },
    { timestamps: true }

);

messageSchema.index({ conversasionId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
