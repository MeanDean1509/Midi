import Conversation from '../models/Conversation.js';
import Friend from '../models/Friend.js';



const pair = (a, b) => (a < b ? [a, b] : [b, a]);


export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();
        
        const recipientId = req.body?.recipientId ?? null;

        const memberIds = req.body?.memberIds ?? [];

        

        if (!recipientId && memberIds.length === 0) {
            return res.status(400).json({ message: 'Recipient ID or member IDs are required.' });
        }

        if (recipientId ) {
            const [userA, userB] = pair(me, recipientId);
            const isFriend = await Friend.findOne({ userA, userB });

            if (!isFriend) {
                return res.status(403).json({ message: 'You are not friends with this user.' });
            }


            return next();


        }

       const friendChecks = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId);
            const isFriend = await Friend.findOne({ userA, userB });
            return isFriend ? null : memberId;
        });

        const results = await Promise.all(friendChecks);
        const nonFriends = results.filter(Boolean);

        if (nonFriends.length > 0) {
            return res.status(403).json({ message: 'You can only add friends in the conversation.', nonFriends });
        }


        next();



        
    }    catch (error) {

        console.error('Error checking friendship:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }


}

export const checkGroupMembership = async (req, res, next) => {
    try {

        const {ConversationId} = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(ConversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        const isMember = conversation.participants.some((p) => p.userId.toString() === userId.toString());

        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this conversation.' });
        }

        req.conversation = conversation;

        next();
        
    } catch (error) {
        console.error('Error checking group membership:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}


