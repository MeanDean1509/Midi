import { useState } from 'react'
import { cn, formatMessageTime } from '@/lib/utils'
import type { Conversation, Message, Participant } from '@/types/chat'
import UserAvatar from './UserAvatar'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'
import { Download, FileText } from 'lucide-react'

interface MessageItemProps {
    message: Message
    index: number
    messages: Message[]
    selectedConv: Conversation
    lastMessageStatus: "delivered" | "seen"
}

const MessageItem = ({message, index, messages, selectedConv, lastMessageStatus}: MessageItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isShowTime = index === 0 ||
    new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 300000;

    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;
    const participant = selectedConv.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );

    const renderMessageContent = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);
        return parts.map((part, index) => {
            if (/^https?:\/\/[^\s]+$/.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "underline break-all font-semibold transition-opacity hover:opacity-80",
                            message.isOwn 
                                ? "text-sky-200 hover:text-sky-100 dark:text-sky-300 dark:hover:text-sky-200" 
                                : "text-primary hover:text-primary/80"
                        )}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const formatFileSize = (size?: number) => {
        if (!size) return '';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

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
            "max-w-[75%] sm:max-w-xs lg:max-w-md space-y-1 flex flex-col min-w-0",
            message.file && "w-72 max-w-full",
            message.isOwn ? "items-end" : "items-start"
        )
        }>

            <Card className={cn("p-3 min-w-0", 
            message.file && "w-full",
            message.isOwn ? 
            "chat-bubble-sent border-0" :
            "chat-bubble-received border-0"
            )}> 

            {message.imgUrl && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <img
                            src={message.imgUrl}
                            alt='Message attachment'
                            className='max-h-72 max-w-full rounded-md object-cover cursor-zoom-in hover:brightness-95 active:scale-[0.98] transition-all duration-200 shadow-soft'
                        />
                    </DialogTrigger>
                    <DialogContent 
                        showCloseButton={false} 
                        className="max-w-[95vw] sm:max-w-[90vw] max-h-[95vh] border-0 p-0 bg-transparent shadow-none flex flex-col items-center justify-center outline-hidden cursor-zoom-out"
                        onClick={() => setIsOpen(false)}
                    >
                        <img
                            src={message.imgUrl}
                            alt='Full size message attachment'
                            className='max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-200'
                        />
                    </DialogContent>
                </Dialog>
            )}

            {message.file && (
                <a
                    href={message.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={message.file.name}
                    className={cn(
                        "flex min-w-0 w-full items-center gap-3 rounded-md border p-3 transition-colors hover:bg-background/30",
                        message.isOwn ? "border-white/20 text-white" : "border-border text-foreground"
                    )}
                >
                    <FileText className='size-6 shrink-0' />
                    <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold'>{message.file.name}</p>
                        <p className={cn(
                            "text-xs",
                            message.isOwn ? "text-white/75" : "text-muted-foreground"
                        )}>
                            {formatFileSize(message.file.size)}
                        </p>
                    </div>
                    <Download className='size-4 shrink-0' />
                </a>
            )}

            {message.content && (
                <p className='text-sm leading-relaxed break-words'>
                    {renderMessageContent(message.content)}
                </p>
            )}

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
