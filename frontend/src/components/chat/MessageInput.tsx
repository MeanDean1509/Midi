import { useAuthStore } from '@/stores/useAuthStore';
import type { Conversation } from '@/types/chat';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImagePlus, Send, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';

const MessageInput = ({ selectedConv }: { selectedConv: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadMessageImage } = useChatStore();
  const [value, setValue] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!user) return null;

  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB.');
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const sendMessage = async () => {
    if (!value.trim() && !selectedImage) return;
    if (isSending) return;

    const currentValue = value;

    try {
      setIsSending(true);
      let imgUrl: string | undefined;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        imgUrl = await uploadMessageImage(formData);
      }

      if (selectedConv.type === 'direct') {
        const otherUser = selectedConv.participants.find((p) => p._id !== user._id);
        if (!otherUser) return;
        await sendDirectMessage(otherUser._id, currentValue, imgUrl);
      } else {
        await sendGroupMessage(selectedConv._id, currentValue, imgUrl);
      }

      setValue('');
      clearSelectedImage();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className='flex flex-col gap-2 p-3 min-h-[56px] bg-background'>
      {imagePreview && (
        <div className='relative w-fit'>
          <img
            src={imagePreview}
            alt='Selected upload'
            className='h-20 w-20 rounded-md border border-border object-cover'
          />
          <Button
            type='button'
            variant='destructive'
            size='icon-sm'
            className='absolute -right-2 -top-2 rounded-full'
            onClick={clearSelectedImage}
            disabled={isSending}
          >
            <X className='size-4' />
          </Button>
        </div>
      )}

      <div className='flex items-center gap-2'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          hidden
          onChange={handleImageChange}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hover:bg-primary/10 transition-smooth'
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <ImagePlus className='size-4' />
        </Button>

        <div className='flex-1 relative'>
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Nhập tin nhắn...'
            className='pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none'
            disabled={isSending}
          />
          <div className='absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
            <Button
              asChild
              variant='ghost'
              size='icon'
              className='size-8 hover:bg-promary/10 transition-smooth'
            >
              <div>
                <EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          className='bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105'
          disabled={isSending || (!value.trim() && !selectedImage)}
        >
          <Send className='size-4 text-white' />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
