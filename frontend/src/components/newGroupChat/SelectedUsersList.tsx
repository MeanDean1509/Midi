import type { Friend } from '@/types/user';
import React from 'react'
import UserAvatar from '../chat/UserAvatar';
import { X } from 'lucide-react';

interface SelectedUsersListProps {
    invitedUsers: Friend[];
    onRemove: (user: Friend) => void;
}

const SelectedUsersList = ({ invitedUsers, onRemove }: SelectedUsersListProps) => {
    if (invitedUsers.length === 0) {
        return null;
    }

  return (
    <div className='flex flex-wrap gap-2 pt-2'>
        {
            invitedUsers.map((user) => (
                <div key={user._id}
                className='flex items-center gap-1 bg-muted text-sm rounded-full px-3 py-1'>
                    <UserAvatar
                    type='chat'
                    name={user.displayName}
                    avatarUrl={user.avatarUrl}>

                    </UserAvatar>
                    <span className='font-medium'>{user.displayName}</span>
                    <X
                    className='cursor-pointer size-3 hover:text-destructive '
                    onClick={() => onRemove(user)}></X>
                </div>
            ))
        }

    </div>
  )
}

export default SelectedUsersList