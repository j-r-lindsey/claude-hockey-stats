import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import { Sports, Timeline, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sports fontSize="large" />,
      title: 'Track Games',
      description: 'Add hockey games you\'ve attended by pasting Hockey Reference URLs',
    },
    {
      icon: <Timeline fontSize="large" />,
      title: 'View Statistics',
      description: 'See comprehensive stats for teams and players from games you\'ve watched',
    },
    {
      icon: <Person fontSize="large" />,
      title: 'Personal Dashboard',
      description: 'Get insights into your hockey viewing history and favorite teams',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          Hockey Stats Tracker
        </Typography>
        
        <Typography
          variant="h5"
          component="h2"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 800 }}
        >
          Track and analyze statistics from all the hockey games you've attended live.
          Import box scores and get ESPN-style insights into your viewing history.
        </Typography>

        {!isAuthenticated && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ mb: 8 }}
          >
            Get Started
          </Button>
        )}

        {isAuthenticated && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 8 }}
          >
            Go to Dashboard
          </Button>
        )}

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 4, 
          mt: 4,
          justifyContent: 'center' 
        }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 300px' },
              maxWidth: { md: '350px' }
            }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default Home;