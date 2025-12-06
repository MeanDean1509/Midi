import { useAuthStore } from '@/stores/useAuthStore';
import type { Conversation } from '@/types/chat';
import React from 'react'
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImagePlus, Send } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';
import { fi } from 'zod/v4/locales';

const MessageInput = ({selectedConv} : {selectedConv: Conversation}) => {
  const {user} = useAuthStore();
  const {sendDirectMessage, sendGroupMessage} = useChatStore();
  const [value, setValue] = React.useState("");

  if (!user) return; 

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currentValue = value;
    setValue("");
    try {
      if (selectedConv.type === "direct") {
        const participants = selectedConv.participants;
        const otherUser = participants.filter(p => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currentValue);
      } else{
        await sendGroupMessage(selectedConv._id, currentValue);
      }
      
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
      
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className='flex items-center gap-2 p-3 min-h-[56px] bg-background'>
        <Button variant="ghost" size="icon" className='hover:bg-primary/10 transition-smooth'>
          <ImagePlus className='size-4'>
            
          </ImagePlus>

        
        </Button>

        <div className='flex-1 relative'>
          <Input
          onKeyDown={handleKeyPress}
          value ={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className='pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none'
          >
            
          </Input>
          <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'> 
              <Button
              asChild
              variant="ghost"
              size="icon"
              className='size-8 hover:bg-promary/10 transition-smooth'>
                <div>
                  <EmojiPicker onChange={(emoji:string) => setValue(`${value}${emoji}`)}/>
                </div>
              
              </Button>
             
            </div>
        </div>

         <Button
         onClick={sendMessage}
          className='bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105' disabled={!value.trim()}>
                <Send className='size-4 text-white'/>
          </Button>
    </div>
  )
}

export default MessageInput