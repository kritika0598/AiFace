import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Alert } from '@mui/material';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = React.useState('');

  useEffect(() => {
    try {
      // Get token from URL
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (token) {
        console.log('Token received, logging in...');
        login(token);
        navigate('/dashboard');
      } else {
        console.error('No token found in URL');
        setError('Authentication failed. No token received.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      console.error('Error in AuthSuccess:', err);
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, login, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default AuthSuccess; 