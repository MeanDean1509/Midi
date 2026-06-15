import {Server} from 'socket.io';
import http from 'http';
import expess from 'express';
import {socketAuthMiddleware} from '../middlewares/socketMiddleware.js';
import { getUserConversationsForSocketIO } from '../controllers/conversationController.js';

const app = expess();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
    const visibleOnlineUserIds = [];
    for (const [userId, info] of onlineUsers.entries()) {
        if (info.showOnlineStatus) {
            visibleOnlineUserIds.push(userId);
        }
    }

    io.sockets.sockets.forEach((socket) => {
        const socketUserId = socket.user?._id?.toString();
        if (!socketUserId) return;

        const socketUserInfo = onlineUsers.get(socketUserId);
        if (socketUserInfo && socketUserInfo.showOnlineStatus) {
            socket.emit('online-users', visibleOnlineUserIds);
        } else {
            socket.emit('online-users', []);
        }
    });
};

export const updateOnlineStatusPreference = (userId, showOnlineStatus) => {
    const userIdStr = userId.toString();
    if (onlineUsers.has(userIdStr)) {
        const info = onlineUsers.get(userIdStr);
        info.showOnlineStatus = showOnlineStatus;
        onlineUsers.set(userIdStr, info);
    }
    broadcastOnlineUsers();
};

io.on('connection', async (socket) => {
    const user = socket.user;
    const userIdStr = user._id.toString();
    console.log(`${user.displayName} Socket connected: ${socket.id}`);
    
    onlineUsers.set(userIdStr, {
        socketId: socket.id,
        showOnlineStatus: user.showOnlineStatus !== false
    });

    broadcastOnlineUsers();

    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach(conversationId =>
        socket.join(conversationId)
    ); 

    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
    });

    socket.join(userIdStr);
    socket.on('disconnect', () => {
        onlineUsers.delete(userIdStr);
        broadcastOnlineUsers();
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

export {io, app, server};