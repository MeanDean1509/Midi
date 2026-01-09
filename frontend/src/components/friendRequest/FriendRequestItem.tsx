import type { FriendRequest } from '@/types/user';
import React, { type ReactNode } from 'react'
import UserAvatar from '../chat/UserAvatar';


interface RequestItemProps{
    RequestInfo: FriendRequest;
    actions: ReactNode
    type: 'sent' | 'received';
}
const FriendRequestItem = ({ RequestInfo, actions, type }: RequestItemProps) => {
  if (!RequestInfo) return;

  const info = type === 'sent' ? RequestInfo.to : RequestInfo.from;

  if (!info) return;

  return (
    <div className='flex items-center justify-between rounded-lg shadow-md border border-primary-foreground p-3'>
        <div className='flex items-center gap-3'>
            <UserAvatar type='sidebar'
            name={info.displayName}>

            </UserAvatar>
            <div>
                <p className='font-medium'>{info.displayName}</p>
                <p className='text-sm text-muted-foreground'>@{info.username}</p>
                
            </div>
        </div>
        {actions}

    </div>

  )
    
}

export default FriendRequestItem