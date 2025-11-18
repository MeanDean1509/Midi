import {create} from "zustand"
import {toast} from "sonner"
import { fi } from "zod/v4/locales"
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken) => {
        set({accessToken});
    },

    clearState: () => {
        set({accessToken: null, user: null, loading: false});
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({loading: true});

            await authService.signUp(username, password, email, firstName, lastName);

            toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.")
        } catch (error) {
            console.log(error);
            toast.error("Đăng ký không thành công. Vui lòng thử lại.");
            
        } finally {
            set({loading: false});
        }
    },

    signIn: async (username, password) => {
        try {
            set({loading: true});
            const {accessToken} = await authService.singIn(username, password);
            // set({accessToken});
            get().setAccessToken(accessToken);
            await get().fetchMe();
            toast.success("Chào mừng bạn quay lại!");
        } catch (error) {
            console.log(error);
            toast.error("Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
        } finally {
            set({loading: false});
        }
    },
    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success("Đăng xuất thành công!");
        } catch (error) {
            console.log(error);
            toast.error("Đã xảy ra lỗi trong quá trình đăng xuất.");
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true});
            const user = await authService.fetchMe();
            set({user});
        } catch (error) {
            console.log(error);
           set({user: null, accessToken: null});
           toast.error("Lấy thông tin người dùng không thành công. Vui lòng thử lại.");
        } finally {
            set({loading: false});
        }
    },

    refresh: async () => {
        try {
            set({loading: true});
            const {user, fetchMe, setAccessToken} = get();
            // authService.refresh() returns the access token string
            const accessToken = await authService.refresh();
            // set({accessToken});\
            setAccessToken(accessToken);
            if (!user) {
                await fetchMe();
            }
        }
        catch (error) {
            console.log(error);
            toast.error("Phiên đã hết hạn. Vui lòng đăng nhập lại.");
            get().clearState();
        }
        finally {
            set({loading: false});
        }
    }
}));