import type { Conversation } from '@/types/chat'
import React from 'react'
import ChatCard from './ChatCard'
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import UnreadCountBadge from './UnreadCountBadge';
import { useSocketStore } from '@/stores/useSocketStore';

const DirectMessageCard = ({conv} : {conv: Conversation}) => {
  const {user} = useAuthStore();
  const {activeConversationId, setActiveConversation, messages, fetchMessages} = useChatStore();

  const {onlineUsers} = useSocketStore();
  if (!user) {
    return null;
  }
  
  const otherUser = conv.participants.find(participant => participant._id !== user._id);
  if (!otherUser) {
    return null;
  }
  const unreadCount = conv.unreadCounts[user._id];
  const lastMessage = conv.lastMessage?.content ?? "";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]){
      await fetchMessages(id);

    }
  };






  return <ChatCard
    convoId={conv._id}
    name={otherUser.displayName}
    timestamp={
      conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : undefined
    }
    isActive={activeConversationId === conv._id}
    onSelect={handleSelectConversation}
    unreadCount={unreadCount}
    leftSection={
      <>
        <UserAvatar
          type="sidebar"
          name={otherUser.displayName ?? ""}
          avatarUrl={otherUser.avatarUrl ?? undefined}
          />

          <StatusBadge status={onlineUsers.includes(otherUser?._id ?? '') ? 'online' : 'offline'} />
          {
            unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />
          }

      </>
    }

    subtitle={
      <p className={cn("text-sm truncate", unreadCount > 0 ? "font-medium text-foreground": "text-muted-foreground")}>
        {lastMessage}
      </p>
    }

    
  />;
};

export default DirectMessageCard