import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress
} from "@mui/material";

const VolunteerFeedback = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/feedback/volunteer",
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Feedback submitted! Thank you for helping us improve.");
      setSubject("");
      setMessage("");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit feedback. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Volunteer Feedback
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your feedback helps us improve the Quick Response Team platform. Please share your suggestions or report any issues you encounter.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Subject"
            fullWidth
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Message"
            fullWidth
            required
            multiline
            minRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Submit Feedback"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VolunteerFeedback;
