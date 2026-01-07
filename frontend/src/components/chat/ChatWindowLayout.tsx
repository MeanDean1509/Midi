import { useChatStore } from '@/stores/useChatStore';
import React, { useEffect } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen';
import ChatWindowSkeleton from './ChatWindowSkeleton';
import { SidebarInset } from '../ui/sidebar';
import ChatWindowHeader from './ChatWindowHeader';
import ChatWinDowBody from './ChatWindowBody';
import MessageInput from './MessageInput';

const ChatWindowLayout = () => {
  const {activeConversationId, conversations, messageLoading:loading, messages, markAsSeen} = useChatStore();

  const selectionConv= conversations.find(convo => convo._id === activeConversationId) ?? null;
  
  useEffect(() => {
    if (!selectionConv) return;

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Failed to mark as seen:", error);
        
      }
    }
    markSeen();

  }, [selectionConv, markAsSeen]);

  if (!selectionConv)
  {
    return <ChatWelcomeScreen />
  }

  
  if (loading) {
    return <ChatWindowSkeleton />
  }

  return (
    <SidebarInset className='flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md '>
      {/* Header */}
      <ChatWindowHeader chat={selectionConv}/>
      {/* Body */}
      <div className='flex-1 overflow-y-auto bg-primary-foreground' >
        <ChatWinDowBody/>

      </div>
      <MessageInput selectedConv={selectionConv}/>

      {/* Footer */}
      </SidebarInset>
  )
}

export default ChatWindowLayout