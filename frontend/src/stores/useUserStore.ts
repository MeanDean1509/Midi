import { create } from 'zustand';
import type { UserState } from '../types/store';
import { userService } from '@/services/userService';
import { useAuthStore } from './useAuthStore';
import { toast } from 'sonner';
import { useChatStore } from './useChatStore';

export const useUserStore = create<UserState>((set, get) => ({
    updateAvatarUrl: async (formData: FormData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: data.avatarUrl,
                });
            }

            useChatStore.getState().fetchConversations();

            
        } catch (error) {
            console.error('Lỗi khi cập nhật ảnh đại diện:', error);
            toast.error('Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.');          
        }
    },
}));