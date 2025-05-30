import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  LinearProgress
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";

const VolunteerStats = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResponses: 0,
    resolvedCases: 0,
    averageResponseTime: 0,
    responsesByDay: [],
    responseTypes: []
  });

  useEffect(() => {
    const fetchVolunteerStats = async () => {
      if (!user || !token) return;

      try {
        setLoading(true);
        
        setTimeout(() => {

          const simulatedStats = {
            totalResponses: Math.floor(Math.random() * 50) + 10,
            resolvedCases: Math.floor(Math.random() * 40) + 5,
            averageResponseTime: Math.floor(Math.random() * 15) + 3,
            responsesByDay: [
              { name: 'Sun', responses: Math.floor(Math.random() * 10) },
              { name: 'Mon', responses: Math.floor(Math.random() * 10) },
              { name: 'Tue', responses: Math.floor(Math.random() * 10) },
              { name: 'Wed', responses: Math.floor(Math.random() * 10) },
              { name: 'Thu', responses: Math.floor(Math.random() * 10) },
              { name: 'Fri', responses: Math.floor(Math.random() * 10) },
              { name: 'Sat', responses: Math.floor(Math.random() * 10) },
            ],
            responseTypes: [
              { name: 'Medical', value: Math.floor(Math.random() * 30) + 5 },
              { name: 'Safety', value: Math.floor(Math.random() * 20) + 5 },
              { name: 'Transport', value: Math.floor(Math.random() * 15) + 3 },
              { name: 'Other', value: Math.floor(Math.random() * 10) + 2 }
            ]
          };
          
          setStats(simulatedStats);
          setLoading(false);
        }, 1000);
        

        
      } catch (error) {
        console.error("Error fetching volunteer statistics:", error);
        toast.error("Could not load volunteer statistics");
        setLoading(false);
      }
    };
    
    fetchVolunteerStats();
  }, [user, token]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const calculateResponseRate = () => {
    return stats.resolvedCases / (stats.totalResponses || 1) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ pb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Volunteer Performance
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track your impact and contribution as a volunteer
        </Typography>
      </Box>

      <Grid container spacing={4}>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h4" color="primary.main">{stats.totalResponses}</Typography>
                <Typography variant="body1" color="text.secondary">Total SOS Responses</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h4" color="success.main">{stats.resolvedCases}</Typography>
                <Typography variant="body1" color="text.secondary">Cases Resolved</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h4" color="info.main">{stats.averageResponseTime} min</Typography>
                <Typography variant="body1" color="text.secondary">Average Response Time</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Response Rate</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateResponseRate()} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: calculateResponseRate() > 75 ? 'success.main' : 
                                      calculateResponseRate() > 50 ? 'info.main' : 'warning.main',
                    }
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(calculateResponseRate())}%`}</Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {calculateResponseRate() > 75 ? 'Excellent response rate! Keep up the good work!' :
               calculateResponseRate() > 50 ? 'Good response rate. You\'re making a difference.' :
               'There\'s room for improvement in your response rate.'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>SOS Categories</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.responseTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.responseTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Cases']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Weekly Activity</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.responsesByDay}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Responses']} />
                <Legend />
                <Bar dataKey="responses" name="SOS Responses" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Your Achievements</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {[
                { title: 'First Response', description: 'Responded to your first SOS alert', achieved: stats.totalResponses > 0 },
                { title: 'Life Saver', description: 'Resolved 10 emergency cases', achieved: stats.resolvedCases >= 10 },
                { title: 'Quick Responder', description: 'Average response time under 5 minutes', achieved: stats.averageResponseTime < 5 },
                { title: 'Dedicated Volunteer', description: 'Responded to 25+ SOS alerts', achieved: stats.totalResponses >= 25 },
                { title: 'Expert Rescuer', description: 'Resolved 50 emergency cases', achieved: stats.resolvedCases >= 50 },
              ].map((achievement, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      backgroundColor: achievement.achieved ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                      borderColor: achievement.achieved ? 'success.main' : 'grey.300'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" component="div" sx={{ color: achievement.achieved ? 'success.main' : 'text.secondary' }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 1,
                          fontWeight: 'bold',
                          color: achievement.achieved ? 'success.main' : 'text.disabled'
                        }}
                      >
                        {achievement.achieved ? 'ACHIEVED' : 'LOCKED'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default VolunteerStats;