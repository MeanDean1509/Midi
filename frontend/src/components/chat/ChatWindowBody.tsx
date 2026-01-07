import { useChatStore } from '@/stores/useChatStore';
import React, { useEffect, useLayoutEffect } from 'react'
import { useState } from 'react';
import ChatWelcomeScreen from './ChatWelcomeScreen';
import MessageItem from './MessageItem';
import InfiniteScroll from 'react-infinite-scroll-component';

const ChatWindowBody = () => {

  const {activeConversationId, conversations, messages: allMessages, fetchMessages} = useChatStore();
  const [lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered");
  const messages = allMessages[activeConversationId!]?.items ?? [];
  const reversedMessages = [...messages].reverse();
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const selectedConv = conversations.find(conv => conv._id === activeConversationId);
  const key = `chat-scroll-${activeConversationId}`;


  //ref
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const lastMessage = selectedConv?.lastMessage;

    if (!lastMessage) return;

    const seenBy = selectedConv.seenBy || [];

    setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");

  }, [selectedConv]);

  // scroll to bottom when open a conversation
  useLayoutEffect(() => {
    if (!messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({ behavior: 'smooth',
    block: 'end',
  });
  }, [activeConversationId]);

  const fetchMoreMessages =  async () => {
    if (!activeConversationId) return;

    try {
      await fetchMessages(activeConversationId)
    } catch (error) {
      console.error("Lỗi khi tải thêm tin nhắn:", error);
      

    }
  };

  const handleScrollSave = () => {
    const container = containerRef.current;
    if (!container || !activeConversationId) return;

    
    sessionStorage.setItem(key, 
      JSON.stringify({
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      })
    );
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container ) return;

    const item = sessionStorage.getItem(key);

    if (item) {
      const { scrollTop } = JSON.parse(item);
      requestAnimationFrame(() => {
        container.scrollTop = scrollTop;
      });

    }
  }, [messages.length]);







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
      <div id='scrollableDiv' ref={containerRef}
      onScroll={handleScrollSave}
      className='flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar'>
      <div ref={messagesEndRef} />
       <InfiniteScroll
        dataLength={messages.length}
        next={fetchMoreMessages}
        hasMore={hasMore}
        loader={<p>Đang tải...</p>}
        scrollableTarget="scrollableDiv"
        inverse={true}
        style={{ display: 'flex', flexDirection: 'column-reverse', overflow: 'visible' }}
       >

        {reversedMessages.map((msg, index) => (
          <MessageItem
            key={msg._id ?? index}
            message={msg}
            index={index}
            messages={reversedMessages}
            selectedConv={selectedConv}
            lastMessageStatus={lastMessageStatus}
          />
        ))}
       </InfiniteScroll>
        
      </div>

    </div>
  )
}

export default ChatWindowBody