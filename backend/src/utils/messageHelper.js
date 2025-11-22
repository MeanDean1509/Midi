export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy:[],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId: senderId,
            createdAt: message.createdAt,
        }
    });

    conversation.participants.forEach((p) => {
        const menberId = p.userId.toString();
        const isSender = menberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(menberId) || 0;
        conversation.unreadCounts.set(
            menberId,
            isSender ? 0 : prevCount + 1
        );
    });


}