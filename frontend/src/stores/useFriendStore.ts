import { friendService } from "@/services/friendService";
import type { FriendState} from "@/types/store";
import {create} from "zustand";


export const useFriendStore = create<FriendState>((set,get) => ({
    loading: false,

    searchByUsername: async (username) => {
        try {
            set({loading: true});

            const user = await friendService.searchUserbyUsername(username);

            return user;
            
        } catch (error) {
            console.error("Error searching user by username:", error);
            return null;
            
        }
        finally {
            set({loading: false});
        }
    },

    addFriend: async (to, message) => {
        try {
            set({loading: true});
            const resultMessage = await friendService.sendFriendRequest(to, message);
            return resultMessage;
        } catch (error) {
            console.error("Error sending friend request:", error);
            return "Lỗi khi gửi lời mời kết bạn.";
        }
        finally {
            set({loading: false});
        }
    }


}));