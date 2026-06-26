import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { sendResetPasswordEmail } from '../utils/emailHelper.js';



const ACCESS_TOKEN_TTL = '30m';
const REFESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; 
const GOOGLE_OAUTH_STATE_TTL = '10m';

const createAccessToken = (userId) => jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});

const createSession = async (userId) => {
    const refreshToken = crypto.randomBytes(64).toString('hex');

    await Session.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + REFESH_TOKEN_TTL),
    });

    return refreshToken;
};

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: REFESH_TOKEN_TTL,
    });
};

const getClientRedirectUrl = (path = '/') => {
    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
    return `${clientUrl || 'http://localhost:5173'}${path}`;
};

const generateGoogleUsername = async (email) => {
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const baseUsername = emailPrefix || `google${crypto.randomBytes(3).toString('hex')}`;
    let username = baseUsername;
    let suffix = 0;

    while (await User.exists({ username })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
    }

    return username;
};

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

        const accessToken = createAccessToken(user._id);
        const refreshToken = await createSession(user._id);
        setRefreshTokenCookie(res, refreshToken);

        return res.status(200).json({ message: `User ${user.username} signed in successfully`, accessToken });


        
    } catch (error) {
        console.error("Error during sign up:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const googleAuth = (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();

        if (!clientId || !callbackUrl) {
            return res.status(500).json({ message: "Google OAuth configuration is missing" });
        }

        const state = jwt.sign(
            { nonce: crypto.randomBytes(16).toString('hex') },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: GOOGLE_OAUTH_STATE_TTL }
        );

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'select_account',
            state,
        });

        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
        console.error("Error starting Google OAuth:", error);
        return res.redirect(getClientRedirectUrl('/signin?oauth=error'));
    }
};

export const googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();

        if (!code || !state || !clientId || !clientSecret || !callbackUrl) {
            return res.redirect(getClientRedirectUrl('/signin?oauth=error'));
        }

        jwt.verify(state, process.env.ACCESS_TOKEN_SECRET);

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error("Google token exchange failed:", tokenData);
            return res.redirect(getClientRedirectUrl('/signin?oauth=error'));
        }

        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.email || profile.verified_email === false) {
            console.error("Google profile fetch failed:", profile);
            return res.redirect(getClientRedirectUrl('/signin?oauth=error'));
        }

        const email = profile.email.toLowerCase();
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = profile.id;
            }
            if (!user.avatarUrl && profile.picture) {
                user.avatarUrl = profile.picture;
            }
            await user.save();
        } else {
            const username = await generateGoogleUsername(email);
            const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

            user = await User.create({
                username,
                hashedPassword,
                email,
                googleId: profile.id,
                displayName: profile.name || username,
                avatarUrl: profile.picture,
            });
        }

        const refreshToken = await createSession(user._id);
        setRefreshTokenCookie(res, refreshToken);

        return res.redirect(getClientRedirectUrl('/'));
    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        return res.redirect(getClientRedirectUrl('/signin?oauth=error'));
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
            console.error("Error sending reset password email:", {
                message: mailError.message,
                status: mailError.status,
                code: mailError.code,
                command: mailError.command,
                responseCode: mailError.responseCode,
                response: mailError.response,
            });
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
