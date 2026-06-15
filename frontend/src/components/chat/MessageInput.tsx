import { useAuthStore } from '@/stores/useAuthStore';
import type { Conversation } from '@/types/chat';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImagePlus, Send, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const MessageInput = ({ selectedConv }: { selectedConv: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadMessageImage } = useChatStore();
  const [value, setValue] = React.useState('');
  const [selectedImages, setSelectedImages] = React.useState<SelectedImage[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const selectedImagesRef = React.useRef<SelectedImage[]>([]);

  React.useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  React.useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  if (!user) return null;

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearSelectedImages = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    resetFileInput();
  };

  const removeSelectedImage = (id: string) => {
    setSelectedImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
    resetFileInput();
  };

  const addImageFiles = (files: File[]) => {
    if (!files.length) return;

    const validImages: SelectedImage[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 5MB.');
        return;
      }

      validImages.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (validImages.length) {
      setSelectedImages((current) => [...current, ...validImages]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(Array.from(e.target.files ?? []));
    resetFileInput();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (!imageFiles.length) return;

    e.preventDefault();
    addImageFiles(imageFiles);

    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      setValue((current) => `${current}${pastedText}`);
    }
  };

  const sendSingleMessage = async (content: string, imgUrl?: string) => {
    if (selectedConv.type === 'direct') {
      const otherUser = selectedConv.participants.find((p) => p._id !== user._id);
      if (!otherUser) return;

      await sendDirectMessage(otherUser._id, content, imgUrl);
      return;
    }

    await sendGroupMessage(selectedConv._id, content, imgUrl);
  };

  const sendMessage = async () => {
    if (!value.trim() && selectedImages.length === 0) return;
    if (isSending) return;

    const currentValue = value.trim();
    const imagesToSend = selectedImages;

    try {
      setIsSending(true);

      if (!imagesToSend.length) {
        await sendSingleMessage(currentValue);
      } else {
        for (const [index, image] of imagesToSend.entries()) {
          const formData = new FormData();
          formData.append('file', image.file);
          const imgUrl = await uploadMessageImage(formData);

          await sendSingleMessage(index === imagesToSend.length - 1 ? currentValue : '', imgUrl);
        }
      }

      setValue('');
      clearSelectedImages();
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
      {selectedImages.length > 0 && (
        <div className='flex max-h-28 flex-wrap gap-2 overflow-y-auto beautiful-scrollbar pr-1'>
          {selectedImages.map((image) => (
            <div key={image.id} className='relative'>
              <img
                src={image.previewUrl}
                alt='Selected upload'
                className='h-20 w-20 rounded-md border border-border object-cover'
              />
              <Button
                type='button'
                variant='destructive'
                size='icon-sm'
                className='absolute -right-2 -top-2 rounded-full'
                onClick={() => removeSelectedImage(image.id)}
                disabled={isSending}
              >
                <X className='size-4' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className='flex items-center gap-2'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
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
            onPaste={handlePaste}
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
          disabled={isSending || (!value.trim() && selectedImages.length === 0)}
        >
          <Send className='size-4 text-white' />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
