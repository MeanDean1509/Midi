import { useFriendStore } from '@/stores/useFriendStore'
import React from 'react'
import FriendRequestItem from './FriendRequestItem'
import { Button } from '../ui/button'
import { toast } from 'sonner'

const ReceivedRequest = () => {
    const {acceptRequest, declineRequest, loading, receivedList} = useFriendStore()
    if (!receivedList || receivedList.length === 0) {
        return <p className='text-sm text-muted-foreground'>Bạn chưa có lời mời kết bạn nào</p>
    }

    const handleAccept = async (requestId: string) => {
        try {
            await acceptRequest(requestId);
            toast.success("Đã chấp nhận lời mời kết bạn")
            
        } catch (error) {
            console.error(error);
            
        }
    }

    const handleDecline = async (requestId: string) => {
        try {
            await declineRequest(requestId)
            toast.info("Đã từ chối lời mời kết bạn")
        }
        catch (error) {
            console.error(error);
        }
    }


    return (
        <div className='space-y-3 mt-4'>
            {
                receivedList.map((request) => (
                    <FriendRequestItem
                        key={request._id}
                        RequestInfo={request}
                        actions={
                            <div className='flex gap-2'>
                                <Button size="sm" variant="primary"
                                    onClick={() => handleAccept(request._id)}
                                    disabled={loading}
                                >
                                    Chấp nhận
                                </Button>
                                <Button size="sm" variant="destructiveOutline"
                                    onClick={() => handleDecline(request._id)}
                                    disabled={loading}
                                >
                                    Từ chối
                                </Button>
                            </div>
                        }
                        type='received'
                    />
                ))
            }
        </div>

    )
    
  
}

export default ReceivedRequest