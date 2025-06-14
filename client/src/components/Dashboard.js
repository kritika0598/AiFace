import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActions,
  CardContent,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tooltip,
  Alert,
  Snackbar,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Tabs,
  Tab,
  LinearProgress,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FaceIcon from '@mui/icons-material/Face';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { keyframes } from '@mui/system';

// Update scanning animation keyframes
const scanningAnimation = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
`;

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzingImageId, setAnalyzingImageId] = useState(null);
  const [usage, setUsage] = useState({ count: 0, limit: 5, remaining: 5 });
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [analysisTab, setAnalysisTab] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchImages();
      fetchUsageStatus();
    }
  }, [user, navigate]);

  const fetchUsageStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/analysis/usage/status`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setUsage(response.data);
    } catch (error) {
      console.error('Error fetching usage status:', error);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/upload/my-images`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchImages();
      setSnackbar({ open: true, message: 'Image uploaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({ open: true, message: 'Error uploading image', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      await axios.delete(`${API_URL}/api/upload/${imageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchImages();
      setSnackbar({ open: true, message: 'Image deleted successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbar({ open: true, message: 'Error deleting image', severity: 'error' });
    }
  };

  const fetchAnalysis = async (imageId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/analysis/${imageId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setAnalysisResult(response.data);
      setSelectedImage(imageId);
      if (response.data.usage) {
        setUsage(response.data.usage);
      }
      setAnalysisDialogOpen(true);
    } catch (error) {
      if (error.response?.status === 404) {
        handleAnalyze(imageId);
      } else {
        console.error('Error fetching analysis:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching analysis',
          severity: 'error'
        });
      }
    }
  };

  const handleAnalyze = async (imageId) => {
    try {
      setAnalyzingImageId(imageId);
      setAnalysisDialogOpen(true);
      const response = await axios.post(
        `${API_URL}/api/analysis/analyze/${imageId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setAnalysisResult(response.data);
      setSelectedImage(imageId);
      if (response.data.usage) {
        setUsage(response.data.usage);
      }
      setSnackbar({
        open: true,
        message: 'Analysis completed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error analyzing image',
        severity: 'error'
      });
    } finally {
      setAnalyzingImageId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderAnalysisDialog = () => (
    <Dialog
      open={analysisDialogOpen}
      onClose={() => setAnalysisDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FaceIcon color="primary" />
          <Typography variant="h6">Face Analysis Results</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {analyzingImageId === selectedImage ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              gap: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Analyzing your image...
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 2,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 1
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  bgcolor: theme.palette.primary.main,
                  animation: `${scanningAnimation} 2s infinite linear`
                }}
              />
            </Box>
          </Box>
        ) : analysisResult ? (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={analysisTab}
                onChange={(e, newValue) => setAnalysisTab(newValue)}
                variant="fullWidth"
              >
                <Tab icon={<PersonIcon />} label="Personality" />
                <Tab icon={<HealthAndSafetyIcon />} label="Age & Health" />
                <Tab icon={<AutoAwesomeIcon />} label="Beauty & Symmetry" />
              </Tabs>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Card>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    image={`${API_URL}/${images.find(img => img._id === selectedImage)?.path}`}
                    alt="Analyzed face"
                    sx={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      bgcolor: 'black'
                    }}
                  />
                </Box>
              </Card>
            </Box>

            {analysisTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Personality Analysis
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    General Analysis
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {analysisResult.message}
                  </Typography>
                </Paper>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Facial Features Analysis
                      </Typography>
                      {analysisResult.personalityAnalysis?.facialFeatures?.map((feature, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            {feature.feature}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {feature.interpretation}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Mian Xiang Analysis
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {analysisResult.personalityAnalysis?.mianXiang?.interpretation}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {analysisResult.personalityAnalysis?.mianXiang?.elements?.map((element, index) => (
                            <Chip key={index} label={element} size="small" />
                          ))}
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Physiognomy Analysis
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {analysisResult.personalityAnalysis?.physiognomy?.interpretation}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {analysisResult.personalityAnalysis?.physiognomy?.traits?.map((trait, index) => (
                            <Chip key={index} label={trait} size="small" />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircleIcon color="success" />
                            <Typography variant="subtitle2" color="success.main">
                              POSITIVE TRAITS
                            </Typography>
                          </Box>
                          {analysisResult.positiveTraits?.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {analysisResult.positiveTraits.map((trait, index) => (
                                <Chip
                                  key={index}
                                  label={trait}
                                  color="success"
                                  variant="outlined"
                                  size="small"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No positive traits identified
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ErrorIcon color="error" />
                            <Typography variant="subtitle2" color="error.main">
                              POTENTIAL DRAWBACKS
                            </Typography>
                          </Box>
                          {analysisResult.negativeTraits?.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {analysisResult.negativeTraits.map((trait, index) => (
                                <Chip
                                  key={index}
                                  label={trait}
                                  color="error"
                                  variant="outlined"
                                  size="small"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No potential drawbacks identified
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {analysisTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Age & Health Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Age Estimation
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Chronological Age
                          </Typography>
                          <Typography variant="h6">
                            {analysisResult.ageHealthAnalysis?.estimatedAge} years
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Biological Age
                          </Typography>
                          <Typography variant="h6">
                            {analysisResult.ageHealthAnalysis?.biologicalAge} years
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Health Indicators
                      </Typography>
                      {analysisResult.ageHealthAnalysis?.healthIndicators?.map((indicator, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {indicator.indicator}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {indicator.status}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Stress Level
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={analysisResult.ageHealthAnalysis?.stressLevel?.value * 100}
                              color={analysisResult.ageHealthAnalysis?.stressLevel?.value > 0.7 ? 'error' : 'primary'}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {analysisResult.ageHealthAnalysis?.stressLevel?.interpretation}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Fatigue Level
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={analysisResult.ageHealthAnalysis?.fatigueLevel?.value * 100}
                              color={analysisResult.ageHealthAnalysis?.fatigueLevel?.value > 0.7 ? 'error' : 'primary'}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {analysisResult.ageHealthAnalysis?.fatigueLevel?.interpretation}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Hydration Level
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={analysisResult.ageHealthAnalysis?.hydrationLevel?.value * 100}
                              color={analysisResult.ageHealthAnalysis?.hydrationLevel?.value < 0.5 ? 'error' : 'primary'}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {analysisResult.ageHealthAnalysis?.hydrationLevel?.interpretation}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {analysisTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Beauty & Symmetry Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Symmetry & Proportions
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Facial Symmetry Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(analysisResult.beautyAnalysis?.symmetryScore * 100, 0), 100)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {Math.min(Math.max(Math.round(analysisResult.beautyAnalysis?.symmetryScore * 100), 0), 100)}% symmetrical
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Golden Ratio Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(analysisResult.beautyAnalysis?.goldenRatioScore * 100, 0), 100)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {Math.min(Math.max(Math.round(analysisResult.beautyAnalysis?.goldenRatioScore * 100), 0), 100)}% match with Golden Ratio
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Aesthetic Balance
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Math.max(analysisResult.beautyAnalysis?.aestheticBalance?.score * 100, 0), 100)}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {analysisResult.beautyAnalysis?.aestheticBalance?.interpretation}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Celebrity Matches
                      </Typography>
                      {analysisResult.beautyAnalysis?.celebrityMatches?.map((match, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">
                            {match.name} ({match.similarity * 100}% match)
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {match.features.map((feature, idx) => (
                              <Chip key={idx} label={feature} size="small" />
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => handleAnalyze(selectedImage)}
          disabled={analyzingImageId === selectedImage || usage.remaining === 0}
          startIcon={<RefreshIcon />}
          variant="outlined"
          color="primary"
        >
          Retry Analysis
        </Button>
        <Button onClick={() => setAnalysisDialogOpen(false)} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: 'url(https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=2070&auto=format&fit=crop)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 0,
          backdropFilter: 'blur(2px)'
        }
      }}
    >
      <AppBar position="static" elevation={0} sx={{ position: 'relative', zIndex: 1, bgcolor: 'rgba(0, 0, 0, 0.8)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaceIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Face Analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}
            >
              <Avatar
                src={user?.picture}
                alt={user?.name}
                sx={{ width: 32, height: 32 }}
              />
              <Typography 
                variant="body1" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  color: 'white',
                  fontWeight: 500
                }}
              >
                Welcome, {user?.name || 'User'}
              </Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2)
                  }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1)
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="h5" align="center">
            Discover What Your Face Says About You!
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Get detailed insights about facial features, emotions, and more
            </Typography>
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Daily Analysis Usage
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                  {usage.remaining} of {usage.limit} remaining
                </Typography>
              </Box>
              <Box sx={{ position: 'relative', height: 8, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 4, overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(usage.count / usage.limit) * 100}%`,
                    bgcolor: usage.remaining > 0 ? 'primary.main' : 'error.main',
                    borderRadius: 4,
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </Box>
              {usage.remaining === 0 && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Daily limit reached. Please try again tomorrow.
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={uploading || usage.remaining === 0}
              sx={{ mt: 2 }}
            >
              {uploading ? 'Uploading...' : 'Choose Image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
            {usage.remaining === 0 && (
              <Typography color="error" variant="body2">
                You've reached your analysis limit
              </Typography>
            )}
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {images.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={`${API_URL}/${image.path}`}
                      alt="Uploaded face"
                      sx={{ 
                        height: 300,
                        objectFit: 'contain',
                        bgcolor: 'black',
                        p: 1
                      }}
                    />
                    {analyzingImageId === image._id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            bgcolor: 'transparent',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '2px',
                              bgcolor: theme.palette.primary.main,
                              animation: `${scanningAnimation} 2s infinite linear`
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded {new Date(image.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<PsychologyIcon />}
                      onClick={() => handleAnalyze(image._id)}
                      disabled={analyzingImageId === image._id || usage.remaining === 0}
                      color="primary"
                      variant="contained"
                    >
                      {analyzingImageId === image._id ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => fetchAnalysis(image._id)}
                      color="secondary"
                      variant="outlined"
                    >
                      View Results
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(image._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {renderAnalysisDialog()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 