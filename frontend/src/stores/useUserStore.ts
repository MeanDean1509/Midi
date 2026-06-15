import { create } from 'zustand';
import type { UserState } from '../types/store';
import { userService } from '@/services/userService';
import { useAuthStore } from './useAuthStore';
import { toast } from 'sonner';
import { useChatStore } from './useChatStore';

export const useUserStore = create<UserState>(() => ({
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
    updateProfile: async (profileData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.updateProfile(profileData);

            if (user && data.user) {
                setUser(data.user);
            }

            toast.success('Cập nhật thông tin cá nhân thành công!');
        } catch (error: any) {
            console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
            const message = error.response?.data?.message || 'Cập nhật thông tin cá nhân thất bại. Vui lòng thử lại.';
            toast.error(message);
            throw error;
        }
    },
    updateOnlineStatus: async (showOnlineStatus: boolean) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.updatePreferences({ showOnlineStatus });

            if (user && data.user) {
                setUser(data.user);
            }

            toast.success('Cập nhật cấu hình thành công!');
        } catch (error: any) {
            console.error('Lỗi khi cập nhật cấu hình online:', error);
            const message = error.response?.data?.message || 'Cập nhật cấu hình thất bại. Vui lòng thử lại.';
            toast.error(message);
            throw error;
        }
    },
    changePassword: async (currentPassword, newPassword) => {
        try {
            await userService.changePassword(currentPassword, newPassword);
            toast.success('Đổi mật khẩu thành công!');
        } catch (error: any) {
            console.error('Lỗi khi đổi mật khẩu:', error);
            const message = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
            toast.error(message);
            throw error;
        }
    },
    deleteAccount: async (password) => {
        try {
            await userService.deleteAccount(password);
            useAuthStore.getState().clearState();
            toast.success('Xóa tài khoản thành công!');
        } catch (error: any) {
            console.error('Lỗi khi xóa tài khoản:', error);
            const message = error.response?.data?.message || 'Xóa tài khoản thất bại. Vui lòng thử lại.';
            toast.error(message);
            throw error;
        }
    },
}));