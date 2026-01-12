import { useFriendStore } from '@/stores/useFriendStore';
import React, { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import {UserPlus, Users} from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import type { Friend } from '@/types/user';
import InviteSuggestionList from '../newGroupChat/InviteSuggestionList';
import SelectedUsersList from '../newGroupChat/SelectedUsersList';
import { toast } from 'sonner';
import { useChatStore } from '@/stores/useChatStore';
import { set } from 'zod';


const NewGroupChatModal = () => {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const {friends, getFriends} = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const {loading, createConversation} = useChatStore();

  const handleGetfriends = async () => {
    await getFriends();
  }

  const handleSelectFriends = (friend: Friend)=>{
    setInvitedUsers([...invitedUsers, friend]);
    setSearch('');
  }

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers(invitedUsers.filter((user) => user._id !== friend._id));
  }

  const handleSubmit = async (e: React.FormEvent) => { 
    try {
      e.preventDefault();
      if (invitedUsers.length === 0) {
        toast.warning('Vui lòng mời ít nhất một thành viên vào nhóm chat.');
        return;
      }
      await createConversation(
        "group",
        groupName,
        invitedUsers.map((user) => user._id)
      );  
      setSearch('');
      setInvitedUsers([]);
      setGroupName('');



    } catch (error) {
      console.error('Lỗi khi tạo nhóm chat:', error);

    }
   };
    

  const filteredFriends = friends.filter((friend) => friend.displayName.toLowerCase().includes(search.toLowerCase())
&& !invitedUsers.some((user) => user._id === friend._id));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          onClick={handleGetfriends} 
          className='flex z-10 justify-center items-center size-5 rounded-full hover:bg-sidebar-accent transition cursor-pointer'>
              <Users className='size-4 '></Users>
              <span className='sr-only'>Tạo nhóm</span>
        </div>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] border-none'>
        <DialogHeader>
          <DialogTitle className='capitalize'>Tạo nhóm chat mới</DialogTitle>
        </DialogHeader>
        <form action="" className='space-y-4'
        onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <Label 
            htmlFor='groupName'
            className='text-sm font-semibold'>
              Tên nhóm
            </Label>
            <Input id='groupName' 
            placeholder='Gõ tên vào đây'
            value={groupName}
            className='glass border-border/50 focus:border-primary/50 transition-smooth'
            onChange={(e) => setGroupName(e.target.value)}
            required
            />
          </div>

          {/* invite members */}

          <div className='space-y-2'>
            <Label
            htmlFor='invite'
            className='text-sm font-semibold'>
              Mời thành viên
            </Label>
            <Input id='invite'
            placeholder='Tìm theo tên hiển thị...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}>
            </Input>
            {/* list suggested friends */}
            {search && filteredFriends.length > 0 &&(
              <InviteSuggestionList
                filteredFriends={filteredFriends}
                onSelect={handleSelectFriends}/>
            )
            }
            
            {/* list chosen friends */}

            <SelectedUsersList
            invitedUsers={invitedUsers}
            onRemove={handleRemoveFriend}/>
          </div>

          <DialogFooter>
           

                <Button type="submit" disabled={loading}
                className='flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth'>
                  {loading ? (
                    <span>Đang tạo...</span>
                  )
                  : (
                    <>
                    <UserPlus className='size-4 mr-2'>
                      </UserPlus>
                      Tạo nhóm</>
                  )}
              </Button>
            
          </DialogFooter>
          
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewGroupChatModal