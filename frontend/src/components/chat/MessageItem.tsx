import { cn, formatMessageTime } from '@/lib/utils'
import type { Conversation, Message, Participant } from '@/types/chat'
import React from 'react'
import UserAvatar from './UserAvatar'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'



interface MessageItemProps {
    message: Message
    index: number
    messages: Message[]
    selectedConv: Conversation
    lastMessageStatus: "delivered" | "seen"
    
}
const MessageItem = ({message, index, messages, selectedConv, lastMessageStatus}: MessageItemProps) => {
  
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isShowTime = index === 0 ||
    new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 300000;

    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;
    const participant = selectedConv.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );
    return (
        <>
        {/* time */}
            {isShowTime && (
                <span className='text-xs text-muted-foreground text-center '>
                    {formatMessageTime(new Date(message.createdAt))}
                </span>

            )}
    <div className={cn(
        "flex gap-2 messeage-bounce mt-1",
        message.isOwn ? "justify-end" : "justify-start",
    )}>

        {/* avatar */}
        {!message.isOwn &&  (
            <div className='w-8'>
                {isGroupBreak && (
                    <UserAvatar
                        type="chat"
                        name={participant?.displayName || "Midi"}
                        avatarUrl={participant?.avatarUrl || undefined}
                    />
                )}
            </div>
        )}

        {/* message */}
        <div
        className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
        )

        }>

            <Card className={cn("p-3", message.isOwn ? 
            "chat-bubble-sent border-0" :
            "chat-bubble-received border-0"
            )}> 

            <p className='text-sm leading-relaxed break-words'>{message.content}   </p>


            </Card>

            

            {/* last message status */}

            {message.isOwn && message._id === selectedConv.lastMessage?._id && (
                <Badge
                variant='outline'
                className={cn("text-xs px-1.5 py-0.5 h-4 border-0",
                    lastMessageStatus === "seen" ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"

                )}

                >
                      {lastMessageStatus === "seen" ? "Đã xem" : "Đã gửi"}

                </Badge>
            )}



        </div>

    </div>
        </>
  )
}

export default MessageItem