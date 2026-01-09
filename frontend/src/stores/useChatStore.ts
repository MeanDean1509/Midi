import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { fi } from "zod/v4/locales";
import {create} from "zustand";
import {persist} from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
    conversations: [],
    messages: {},
    activeConversationId: null,
    convoLoading: false,
    messageLoading: false,
    setActiveConversation: (id) => set({activeConversationId: id}),
    reset: () => {
        set({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false, 
    });
    },
    fetchConversations: async () => {
        try {
            set({convoLoading: true});
            // call api to fetch conversations
            const {conversations} = await chatService.fetchConversations();

            set({conversations, convoLoading: false});
            
            
        } catch (error) {
            console.log("Failed to fetch conversations:", error);
            set({convoLoading: false});
            
        }
    },

    fetchMessages: async (conversationId) => {
        const {activeConversationId, messages} = get();
        const {user} = useAuthStore.getState();

        const convId = conversationId ?? activeConversationId;

        if (!convId) return;

        const current = messages?.[convId];

        const nextCursor = current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({messageLoading: true});

        try {

            const {messages: fetched, cursor} = await chatService.fetchMessages(convId, nextCursor);

            const processed = fetched.map((msg) => ({
                ...msg,
                isOwn: msg.senderId === user?._id,
            }));
            set((state) => {
                const prev = state.messages[convId]?.items ?? [];
                const merged = prev.length > 0 ? [...processed, ...prev] : processed;

                return {
                    messages: {
                        ...state.messages,
                        [convId]: {
                            items: merged,
                            hasMore: !!cursor,
                            nextCursor: cursor ?? null,
                        }, 
                    },
                }
            });

            
        } catch (error) {
            console.log("Failed to fetch messages:", error);
           
            
        }
        finally {
            set({messageLoading: false});
        }

    },


    sendDirectMessage: async (recipientId, content="", imgUrl) => {
        try {
            const {activeConversationId} = get();
            await chatService.sendDirectMessage(recipientId, content, imgUrl, activeConversationId || undefined);
            set((state)=> ({
                conversations: state.conversations.map((convo) =>  convo._id === activeConversationId ? {...convo, seenBy:[]} : convo)
            }));
            
        } catch (error) {

            console.error("Failed to send direct message:", error);
            
        }
    },
    sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
            await chatService.sendGroupMessage(conversationId, content, imgUrl);
            set((state)=> ({
                conversations: state.conversations.map((convo) =>  convo._id === get().activeConversationId ? {...convo, seenBy:[]} : convo)
                
            }));
            
        } catch (error) {
            console.error("Failed to send group message:", error);
            
        }
    },
    addMessage: async (message) => {
        try {
            const {user} = useAuthStore.getState();
            const {fetchMessages} = get();
            message.isOwn = message.senderId === user?._id;

            const convoId = message.conversationId;

            let prevItems = get().messages[convoId]?.items ?? [];

            if (prevItems.length === 0) {
                await fetchMessages(message.conversationId);
                prevItems = get().messages[convoId]?.items ?? [];

            }

            set((state) => {
                if(prevItems.some((msg) => msg._id === message._id)) {
                    return state;
                }

                return {
                    messages: {
                        ...state.messages,
                        [convoId]: {
                            items: [...prevItems, message],
                            hasMore: state.messages[convoId].hasMore,
                            nextCursor: state.messages[convoId].nextCursor ?? undefined,
                        },
                    },
                }

            }
            );

            
        } catch (error) {
            console.error("Failed to add message:", error);
            
        }
    },
    updateConversation: (conversation ) => {
        set((state) => ({
            conversations: state.conversations.map((convo) => convo._id === conversation._id ? {
                ...convo,
                ...conversation} : convo
            )
        }));
    },
    markAsSeen:  async () => {
        try {
            const {user} = useAuthStore.getState();
            const {activeConversationId, conversations} = get();

            if (!activeConversationId || !user) return;

            const convo = conversations.find((c) => c._id === activeConversationId);

            if ((convo?.unreadCounts?.[user._id] ?? 0) === 0) return;

            await chatService.markAsSeen(activeConversationId);

            set((state) => ({
                conversations: state.conversations.map((c) => c._id === activeConversationId && c.lastMessage ? {
                    ...c,
                    unreadCounts: {
                        ...c.unreadCounts,
                        [user._id]: 0,
                    },
                } : c)
            }));



            
        } catch (error) {
            console.error("Failed to mark conversation as seen:", error);

            
        }
    },
    addConvo: (convo) => {
        set((state) => {
            const exists = state.conversations.some((c) => c._id.toString() === convo._id.toString());
            return {
                conversations: exists ? state.conversations : [convo, ...state.conversations],
                activeConversationId: convo._id,
            };
        });
    },
    createConversation: async (type, name, memberIds) => {
        try {
            const conversation = await chatService.createConversation(type, name, memberIds);
            get().addConvo(conversation);
            useSocketStore.getState().socket?.emit("join-conversation", conversation._id);

            
        } catch (error) {
            console.error("Failed to create conversation:", error);
            
            
        }
    },
}),
        {
            name: "chat-storage",
            partialize: (state) => ({conversations:state.conversations}),
        }
    )
);

            