import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../constants';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    try {
      setError('');
      const authUrl = `${API_URL}/api/auth/google`;
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to initiate Google login. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Welcome to AiFace
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
            sx={{ mt: 1 }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 