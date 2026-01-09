import api from "@/lib/axios";


export const friendService = {
    async searchUserbyUsername(username: string) {
        const res = await api.get(`/users/search?username=${username}`);
        return res.data.user;
    },

    async sendFriendRequest(to: string, message?: string) {
        const res = await api.post("/friends/requests", {
            to,
            message
        });
        // API returns the created request object; convert to user-facing message for UI to render safely
        return res.data.message ?? "Gửi lời mời kết bạn thành công.";
    },

    async getAllfriendRequests() {
        try {
            const res = await api.get("/friends/requests");
            const {sent, received} = res.data;
            return {sent, received};
        } catch (error) {
            console.error("Error fetching friend requests:", error);
            
        }
    },

    async acceptRequest(requestId: string) {
        try {
            const res = await api.post(`/friends/requests/${requestId}/accept`);
            return res.data.newFriend;
        } catch (error) {
            console.error("Error accepting friend request:", error);
            
        }
    
    },
    async declineRequest(requestId: string) {
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
            
        }
        catch (error) {
            console.error("Error declining friend request:", error);
            
        }
    },

    async getFriendList() {
        const res = await api.get("/friends");
        return res.data.friends;
    }
}