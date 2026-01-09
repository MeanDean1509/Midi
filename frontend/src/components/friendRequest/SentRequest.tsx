import { useFriendStore } from '@/stores/useFriendStore';
import React from 'react'
import FriendRequestItem from './FriendRequestItem';

const SentRequest = () => {
  const {sentList} = useFriendStore();

  if (!sentList || sentList.length === 0){
    return (
      <p className='text-sm text-muted-foreground'>
        Bạn chưa gửi lời mời kết bạn nào.
      </p>
    )
  }
  return (
    <div className='space-y-3 mt-4'>
      <>{sentList.map((request) => 
      <FriendRequestItem key={request._id}
       RequestInfo={request}
        type='sent' actions={<p className='text-sm text-muted-foreground'>
          Đang chờ trả lời...
        </p>} />
      )}</>

    </div>
  )
}


export default SentRequest