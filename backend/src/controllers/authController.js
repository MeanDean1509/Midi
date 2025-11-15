import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';


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

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
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
}