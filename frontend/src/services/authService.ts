import api from '@/lib/axios';

export const authService = {
    signUp: async (username: string, password: string, email: string, firstName: string, lastName: string) => {
        const res = await api.post('/auth/signup', { username, password, email, firstName, lastName },{withCredentials: true});

        return res.data;
    },

    singIn: async (username: string, password: string) => {
        const res = await api.post('/auth/signin', { username, password },{withCredentials: true});
        return res.data;
    },

    getGoogleAuthUrl: () => {
        return import.meta.env.VITE_GOOGLE_AUTH_URL || `${import.meta.env.VITE_API_URL}/auth/google`;
    },

    signOut: async () => {
        return api.post('/auth/signout', {},{withCredentials: true});
    },

    fetchMe: async () => {
        const res = await api.get('/users/me',{withCredentials: true});
        return res.data.user;
    },

    refresh: async () => {
        // send an empty body and explicit config (though instance has withCredentials:true)
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        return res.data.accessToken;
    },

    forgotPassword: async (email: string) => {
        const res = await api.post('/auth/forgot-password', { email }, { withCredentials: true });
        return res.data;
    },

    resetPassword: async (email: string, code: string, newPassword: string) => {
        const res = await api.post('/auth/reset-password', { email, code, newPassword }, { withCredentials: true });
        return res.data;
    }
}
