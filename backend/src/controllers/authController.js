import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { sendResetPasswordEmail } from '../utils/emailHelper.js';



const ACCESS_TOKEN_TTL = '30m';
const REFESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; 

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if(!username || !password || !email || !firstName || !lastName){
            return res.status(400).json({ message: "All fields of username, password, email, firstName, and lastName are required" });
        }

        const duplicate = await User.findOne({username});

        if(duplicate){
            return res.status(409).json({ message: "Username already exists" });
        }

        const emailExists = await User.findOne({email});
        if(emailExists){
            return res.status(409).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`,
        });

        return res.sendStatus(204);
    }
    catch (error) {
        console.error("Error during sign up:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;

        if(!username || !password){
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await User.findOne({username});

        if(!user){
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect){
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});

        const refreshToken = crypto.randomBytes(64).toString('hex');

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFESH_TOKEN_TTL),
        });

        // return refesh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFESH_TOKEN_TTL,
        });

        return res.status(200).json({ message: `User ${user.username} signed in successfully`, accessToken });


        
    } catch (error) {
        console.error("Error during sign up:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const signOut = async (req, res) => {
    try {
        // Get refresh token from cookies
        const token = req.cookies?.refreshToken;
        if (token) {
            // Delete session associated with the refresh token
            await Session.deleteOne({ refreshToken: token });

            res.clearCookie("refreshToken");
        }

        return res.sendStatus(204);

        
    } catch (error) {
        console.error("Error during sign out:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
export const refreshToken = async (req, res) => {
    try {

        // get refresh token from cookies
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "Refresh token not provided" });
        }

        // compare token with sessions in db

        const session = await Session.findOne({refreshToken: token});
        if(!session){
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // check if session is expired
        if(session.expiresAt < new Date()){
            
            return res.status(403).json({ message: "Refresh token expired" });
        }

        // generate new access token
        const accessToken = jwt.sign({userId: session.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        return res.status(200).json({ accessToken });
        

        
    } catch (error) {
        console.error("Error during token refresh:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordCode = otpCode;
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        try {
            await sendResetPasswordEmail(user.email, otpCode);
        } catch (mailError) {
            console.error("Error sending reset password email:", mailError);
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        return res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: "Email, code, and new password are required" });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.hashedPassword = hashedPassword;
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;
        await user.save();

        // Delete all sessions for the user to force re-login
        await Session.deleteMany({ userId: user._id });

        return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};