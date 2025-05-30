import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";

dotenv.config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, nid } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      role, 
      address, 
      nid,
      isVerified: role !== "volunteer",
      isApproved: role !== "volunteer"
    });
    await newUser.save();

    const emailSubject = "Welcome to SOS";
    let emailText = `Hi ${name},\n\nThank you for registering on SOS! We're excited to have you on board.`;
    
    if (role === "volunteer") {
      emailText += `\n\nYour volunteer application is under review. An admin will verify your account shortly.`;
    }
    
    emailText += `\n\nBest Regards,\nSOS Team`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailSubject,
      text: emailText,
    });

    res.status(201).json({ 
      message: role === "volunteer" 
        ? "Registration successful. Your volunteer account is pending admin verification." 
        : "User registered successfully. Please login." 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Login 
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "volunteer" && (!user.isVerified || !user.isApproved)) {
      return res.status(403).json({ 
        message: "Your volunteer account is pending admin verification. You will be notified once your account is approved." 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); 
    await user.save();


    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. This OTP is valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to email. Please verify OTP to login." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;


    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });


    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

 
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });
    console.log("Generated Token:", token); 


    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      token,      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        nid: user.nid,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



export const getUser = async (req, res) => {
  try {

    const user = await User.findById(req.user.userId).select("-password"); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    res.status(200).json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        nid: user.nid,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        blacklisted: user.blacklisted,
        volunteerStatus: user.volunteerStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const { name, email, phone, address, nid } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) {

      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use by another account" });
        }
      }
      user.email = email;
    }
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (nid) user.nid = nid;

    await user.save();    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        nid: user.nid,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile", error: error.message });
  }
};


export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Your account has been deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email address" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and save to database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send email
    const emailSubject = "Password Reset Request - SOS Emergency Response";
    const emailText = `Hi ${user.name},

You have requested to reset your password for your SOS Emergency Response account.

Please click on the following link to reset your password:
${resetURL}

This link will expire in 15 minutes for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best Regards,
SOS Emergency Response Team`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: emailSubject,
      text: emailText,
    });

    res.status(200).json({ 
      message: "Password reset link has been sent to your email address" 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    const emailSubject = "Password Reset Successful - SOS Emergency Response";
    const emailText = `Hi ${user.name},

Your password has been successfully reset for your SOS Emergency Response account.

If you did not make this change, please contact our support team immediately.

Best Regards,
SOS Emergency Response Team`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: emailSubject,
      text: emailText,
    });

    res.status(200).json({ 
      message: "Password has been reset successfully. You can now login with your new password." 
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload Profile Picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      const oldImagePath = path.join('uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (error) {
          console.log("Error deleting old profile picture:", error);
        }
      }
    }

    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePicturePath,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        nid: user.nid,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log("Error cleaning up file:", cleanupError);
      }
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Profile Picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete profile picture file if it exists
    if (user.profilePicture) {
      const imagePath = path.join('uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.log("Error deleting profile picture file:", error);
        }
      }
    }

    // Remove profile picture from user record
    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      message: "Profile picture deleted successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        nid: user.nid,
        profilePicture: null,
      },
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

