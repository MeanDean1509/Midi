
import React from 'react'
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import { useFriendStore } from '@/stores/useFriendStore';
import { MessageCircleMore, Users } from 'lucide-react';
import { Card } from '../ui/card';
import UserAvatar from '../chat/UserAvatar';
import { useChatStore } from '@/stores/useChatStore';

const FriendListModal = () => {
    const {friends} = useFriendStore();
    const {createConversation} = useChatStore();



  const handleAddConversation =  async (friendId: string) => {
  
    await createConversation("direct", "", [friendId]);
  }

  return (
    <DialogContent className='glass max-w-md'>
  <DialogHeader>
    <DialogTitle className='flex items-center gap-2 text-xl capitalize'>
      <MessageCircleMore className='size-5' />
      bắt đầu hội thoại mới
    </DialogTitle>
  </DialogHeader>

  {/* friendlist */}
  <div className='space-y-4'>
    <h1 className='text-sm font-semibold text-muted-foreground mb-3 uppercase -tracking-wide'>
      Danh sách bạn bè
    </h1>

    {friends.length === 0 ? (
      // 👇 Empty state
      <div className='text-center py-8 text-muted-foreground'>
        <Users className='size-12 mx-auto mb-3 opacity-50' />
        <p>Bạn chưa có bạn bè nào.</p>
        <p className='text-sm'>
          Hãy thêm bạn bè để bắt đầu trò chuyện!
        </p>
      </div>
    ) : (
      // 👇 Friend list
      <div className='space-y-2 max-h-60 overflow-y-auto'>
        {friends.map((friend) => (
          <DialogClose asChild key={friend._id}>
            <Card
              className='p-3 cursor-pointer transition-smooth hover:shadow-soft glass hover:bg-muted/30 group/friendCard'
              onClick={() => handleAddConversation(friend._id)}
            >
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <UserAvatar
                    type="sidebar"
                    name={friend.displayName}
                    avatarUrl={friend.avatarUrl}
                  />
                </div>

                <div className='flex-1 min-w-0 flex flex-col'>
                  <h2 className='font-semibold text-sm truncate'>
                    {friend.displayName}
                  </h2>
                  <span className='text-sm text-muted-foreground'>
                    @{friend.username}
                  </span>
                </div>
              </div>
            </Card>
          </DialogClose>
        ))}
      </div>
    )}
  </div>
</DialogContent>

  )
}

export default FriendListModal