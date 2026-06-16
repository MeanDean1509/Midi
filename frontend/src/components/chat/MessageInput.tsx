import { useAuthStore } from '@/stores/useAuthStore';
import type { Conversation, MessageFile } from '@/types/chat';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FileText, ImagePlus, Paperclip, Send, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useChatStore } from '@/stores/useChatStore';
import { toast } from 'sonner';

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type SelectedFile = {
  id: string;
  file: File;
};

const maxImageSize = 5 * 1024 * 1024;
const maxFileSize = 25 * 1024 * 1024;

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageInput = ({ selectedConv }: { selectedConv: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadMessageFile, uploadMessageImage } = useChatStore();
  const [value, setValue] = React.useState('');
  const [selectedImages, setSelectedImages] = React.useState<SelectedImage[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<SelectedFile[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
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

  const resetFileInputs = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const clearSelectedAttachments = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    setSelectedFiles([]);
    resetFileInputs();
  };

  const removeSelectedImage = (id: string) => {
    setSelectedImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
    resetFileInputs();
  };

  const removeSelectedFile = (id: string) => {
    setSelectedFiles((current) => current.filter((item) => item.id !== id));
    resetFileInputs();
  };

  const addImageFiles = (files: File[]) => {
    if (!files.length) return;

    const validImages: SelectedImage[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui long chon file anh.');
        return;
      }

      if (file.size > maxImageSize) {
        toast.error('Anh khong duoc vuot qua 5MB.');
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

  const addAttachmentFiles = (files: File[]) => {
    if (!files.length) return;

    const validFiles: SelectedFile[] = [];

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        toast.error('Dung nut hinh anh de gui file anh.');
        return;
      }

      if (file.size > maxFileSize) {
        toast.error('File khong duoc vuot qua 25MB.');
        return;
      }

      validFiles.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
      });
    });

    if (validFiles.length) {
      setSelectedFiles((current) => [...current, ...validFiles]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(Array.from(e.target.files ?? []));
    resetFileInputs();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addAttachmentFiles(Array.from(e.target.files ?? []));
    resetFileInputs();
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

  const sendSingleMessage = async (content: string, imgUrl?: string, file?: MessageFile) => {
    if (selectedConv.type === 'direct') {
      const otherUser = selectedConv.participants.find((p) => p._id !== user._id);
      if (!otherUser) return;

      await sendDirectMessage(otherUser._id, content, imgUrl, file);
      return;
    }

    await sendGroupMessage(selectedConv._id, content, imgUrl, file);
  };

  const sendMessage = async () => {
    if (!value.trim() && selectedImages.length === 0 && selectedFiles.length === 0) return;
    if (isSending) return;

    const currentValue = value.trim();
    const imagesToSend = selectedImages;
    const filesToSend = selectedFiles;
    const attachmentCount = imagesToSend.length + filesToSend.length;

    try {
      setIsSending(true);

      if (!attachmentCount) {
        await sendSingleMessage(currentValue);
      } else {
        for (const [index, image] of imagesToSend.entries()) {
          const formData = new FormData();
          formData.append('file', image.file);
          const imgUrl = await uploadMessageImage(formData);

          await sendSingleMessage(index === attachmentCount - 1 ? currentValue : '', imgUrl);
        }

        for (const [index, attachment] of filesToSend.entries()) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          const uploadedFile = await uploadMessageFile(formData);
          const attachmentIndex = imagesToSend.length + index;

          await sendSingleMessage(attachmentIndex === attachmentCount - 1 ? currentValue : '', undefined, uploadedFile);
        }
      }

      setValue('');
      clearSelectedAttachments();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Khong the gui tin nhan. Vui long thu lai.');
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

      {selectedFiles.length > 0 && (
        <div className='flex max-h-28 flex-wrap gap-2 overflow-y-auto beautiful-scrollbar pr-1'>
          {selectedFiles.map((attachment) => (
            <div
              key={attachment.id}
              className='relative flex max-w-64 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2'
            >
              <FileText className='size-5 shrink-0 text-primary' />
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{attachment.file.name}</p>
                <p className='text-xs text-muted-foreground'>{formatFileSize(attachment.file.size)}</p>
              </div>
              <Button
                type='button'
                variant='destructive'
                size='icon-sm'
                className='absolute -right-2 -top-2 rounded-full'
                onClick={() => removeSelectedFile(attachment.id)}
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
          ref={imageInputRef}
          type='file'
          accept='image/*'
          multiple
          hidden
          onChange={handleImageChange}
        />
        <input
          ref={attachmentInputRef}
          type='file'
          multiple
          hidden
          onChange={handleFileChange}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hover:bg-primary/10 transition-smooth'
          onClick={() => imageInputRef.current?.click()}
          disabled={isSending}
        >
          <ImagePlus className='size-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hover:bg-primary/10 transition-smooth'
          onClick={() => attachmentInputRef.current?.click()}
          disabled={isSending}
        >
          <Paperclip className='size-4' />
        </Button>

        <div className='flex-1 relative'>
          <Input
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Nhap tin nhan...'
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
          disabled={isSending || (!value.trim() && selectedImages.length === 0 && selectedFiles.length === 0)}
        >
          <Send className='size-4 text-white' />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
