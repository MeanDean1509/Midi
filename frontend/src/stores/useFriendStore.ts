import { friendService } from "@/services/friendService";
import type { FriendState} from "@/types/store";
import {create} from "zustand";


export const useFriendStore = create<FriendState>((set,get) => ({
    friends: [],
    loading: false,
    receivedList: [],
    sentList: [],


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
    },

    getAllFriendRequests: async () => {
        try {
            set({loading: true});
            const result = await friendService.getAllfriendRequests();

            if (!result) return;

            const {sent, received} = result;

            set({sentList: sent, receivedList: received});
            
        } catch (error) {
            console.error("Error fetching friend requests:", error);
            
        }
        finally {
            set({loading: false});
        }
    },
    acceptRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((req) => req._id !== requestId)
            }));
            
        } catch (error) {
            console.error("Error accepting friend request:", error);
        }
        finally {
            set({loading: false});
        }
    },
    declineRequest: async (requestId) => {
        try {
            set({loading: true});
            await friendService.declineRequest(requestId);
            set((state) => ({
                receivedList: state.receivedList.filter((req) => req._id !== requestId)
            }));


            
        } catch (error) {
            console.error("Error declining friend request:", error);
            
        }
        finally {
            set({loading: false});
        }
    },

    getFriends: async () => {
        try {
            set({loading: true});
            const friends = await friendService.getFriendList();
            set({friends: friends});
        } catch (error) {
            console.error("Error fetching friends list:", error);
            set({friends: []});
        } finally {
            set({loading: false});
        }
    }


}));