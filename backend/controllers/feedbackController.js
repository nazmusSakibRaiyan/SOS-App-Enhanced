import Feedback from "../models/Feedback.js";
export const submitVolunteerFeedback = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required." });
    }
    const feedback = new Feedback({ user: userId, subject, message });
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit feedback." });
  }
};