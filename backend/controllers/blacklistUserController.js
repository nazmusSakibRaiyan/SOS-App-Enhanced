import User from "../models/user.js";


export const blacklistUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.blacklisted = true; 
    await user.save();

    res.status(200).json({ message: "User blacklisted successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to blacklist user", error: error.message });
  }
};

export const getBlacklistedUsers = async (req, res) => {
  try {
    const blacklistedUsers = await User.find({ blacklisted: true }).select("-password -otp -otpExpires");
    res.status(200).json(blacklistedUsers);
  } catch (error) {
    console.error("Error fetching blacklisted users:", error);
    res.status(500).json({ message: "Failed to fetch blacklisted users" });
  }
};

export const removeFromBlacklist = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.blacklisted) {
      return res.status(400).json({ message: "User is not blacklisted" });
    }

    user.blacklisted = false;
    await user.save();

    res.status(200).json({ message: "User removed from blacklist successfully" });
  } catch (error) {
    console.error("Error removing user from blacklist:", error);
    res.status(500).json({ message: "Failed to remove user from blacklist" });
  }
};