import { useChatStore } from '@/stores/useChatStore';
import React from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen';
import MessageItem from './MessageItem';

const ChatWindowBody = () => {

  const {activeConversationId, conversations, messages: allMessages} = useChatStore();
  const messages = allMessages[activeConversationId!]?.items ?? [];
  const selectedConv = conversations.find(conv => conv._id === activeConversationId);

  if (!selectedConv) {
      return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return(
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        Chưa có tin nhắn nào trong cuộc trò chuyện này!
      </div>
    )
  }


  return (
    <div className='p-4 bg-primary-foreground h-full flex flex-col overflow-hidden'>
      <div className='flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar'>
        {messages.map((msg, index) => (
          <MessageItem
            key={msg._id ?? index}
            message={msg}
            index={index}
            messages={messages}
            selectedConv={selectedConv}
            lastMessageStatus="delivered"
          />
        ))}
      </div>

    </div>
  )
}

export default ChatWindowBody