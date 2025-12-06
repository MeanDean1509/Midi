import React from 'react'
import { useChatStore } from '@/stores/useChatStore'
import GroupChatCard from './GroupChatCard';
const GroupChatList = () => {

  const {conversations} = useChatStore();
  if (!conversations) {
    return;
  }

  const groupConversations = conversations.filter(conv => conv.type === "group");

 return (
    <div className='flex-1 overflow-y-auto p-2 space-y-2'>
      {groupConversations.map((conv) => (
        <GroupChatCard conv={conv}
        key={conv._id} />
      ))}

    </div>
  )
}

export default GroupChatList