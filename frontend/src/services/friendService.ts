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
    }
}