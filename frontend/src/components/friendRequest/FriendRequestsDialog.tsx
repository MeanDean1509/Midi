import React from 'react'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '../ui/tabs';
import {useFriendStore} from '@/stores/useFriendStore';  
import { set } from 'zod';
import SentRequest from './SentRequest';
import ReceivedRequest from './ReceivedRequest';
interface FriendRequestsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}
const FriendRequestsDialog = ({ open, setOpen }: FriendRequestsDialogProps) => {
  const [tab, setTab] = useState("received");
  const {getAllFriendRequests} = useFriendStore();
  useEffect(() => {
    const loadRequests = async () => {
      try {
        await getAllFriendRequests();
      } catch (error) {
        console.error("Failed to load friend requests:", error);
      }
    };
    loadRequests();
  }, []);

  return (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-lg">
      
      {/* Header */}
      <DialogHeader>
        <DialogTitle>Lời mời kết bạn</DialogTitle>
      </DialogHeader>

      {/* Tabs content */}
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Đã nhận</TabsTrigger>
          <TabsTrigger value="sent">Đã gửi</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <ReceivedRequest />
        </TabsContent>

        <TabsContent value="sent">
          <SentRequest />
        </TabsContent>
      </Tabs>

    </DialogContent>
  </Dialog>
);

}

export default FriendRequestsDialog