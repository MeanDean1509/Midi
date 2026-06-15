import { uploadImageFromBuffer } from '../middlewares/uploadMiddleware.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import Session from '../models/Session.js';
export const authMe = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            user
        });

    } catch (error) {
        console.error("Error during auth me:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const searchUserbyUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Username query parameter is required" });
        }

        const user = await User.findOne({ username}).select("_id displayName username avatarUrl")
        return res.status(200).json({user});
        
    } catch (error) {
        console.error("Error during user search:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        
    }
}

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatarUrl: result.secure_url,
                avatarId: result.public_id  },
            { new: true }
        ).select("avatarUrl");

        if (!updatedUser.avatarUrl) {
            return res.status(500).json({ message: "Avatar return null" });
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });


          

    } catch (error) {
        console.error("Error during avatar upload:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { displayName, username, phone, bio } = req.body;

        // Validations
        if (!displayName || displayName.trim() === "") {
            return res.status(400).json({ message: "Tên hiển thị không được để trống" });
        }

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Tên người dùng không được để trống" });
        }

        const formattedUsername = username.toLowerCase().trim();

        // Check if username is already taken by another user
        if (formattedUsername !== req.user.username) {
            const existingUser = await User.findOne({ username: formattedUsername });
            if (existingUser) {
                return res.status(400).json({ message: "Tên người dùng đã tồn tại" });
            }
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({ message: "Giới thiệu tối đa 500 ký tự" });
        }

        // Update details (specifically NOT updating email or passwords)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                displayName: displayName.trim(),
                username: formattedUsername,
                phone: phone ? phone.trim() : "",
                bio: bio ? bio.trim() : ""
            },
            { new: true }
        ).select("-hashedPassword");

        return res.status(200).json({ user: updatedUser });

    } catch (error) {
        console.error("Error during profile update:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const { showOnlineStatus } = req.body;

        if (typeof showOnlineStatus !== "boolean") {
            return res.status(400).json({ message: "Trạng thái hiển thị online không hợp lệ" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { showOnlineStatus },
            { new: true }
        ).select("-hashedPassword");

        // Dynamically import updateOnlineStatusPreference to avoid circular dependencies
        const { updateOnlineStatusPreference } = await import('../socket/index.js');
        updateOnlineStatusPreference(userId, showOnlineStatus);

        return res.status(200).json({ user: updatedUser });

    } catch (error) {
        console.error("Error during preferences update:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const passwordCorrect = await bcrypt.compare(currentPassword, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.hashedPassword = hashedNewPassword;
        await user.save();

        return res.status(200).json({ message: "Đổi mật khẩu thành công" });

    } catch (error) {
        console.error("Error during change password:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Vui lòng nhập mật khẩu để xác nhận xóa tài khoản" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(400).json({ message: "Mật khẩu xác nhận không chính xác" });
        }

        await User.findByIdAndDelete(userId);
        await Session.deleteMany({ userId });
        res.clearCookie("refreshToken");

        return res.status(200).json({ message: "Xóa tài khoản thành công" });

    } catch (error) {
        console.error("Error during delete account:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}