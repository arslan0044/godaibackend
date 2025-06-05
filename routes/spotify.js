const express = require('express');
const router = express.Router();
const config = require('config');
const axios = require('axios');
const { User } = require('../models/user');
const { SpotifyAuth } = require('../models/spotifyAuth');
const auth = require('../middleware/auth');
const querystring = require('querystring');

// Spotify API credentials
const CLIENT_ID = config.get('spotifyClientId');
const CLIENT_SECRET = config.get('spotifyClientSecret');
const REDIRECT_URI = config.get('spotifyRedirectUri');

// Spotify auth endpoints
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Generate random state for OAuth security
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Step 1: Redirect to Spotify login
router.get('/login',auth, (req, res) => {
    const { app } = req.query
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing';

  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: app + '|' + req.user._id
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${queryParams}`);
});

// Step 2: Handle callback from Spotify
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const app = state.split('|')[0] || null;
  const userId = state.split('|')[1] || null;

  if (!code || !userId) {
    return res.status(400).send({ 
      success: false, 
      message: 'Authorization code or user ID missing' 
    });
  }

  try {
    // Exchange code for access token
    const response = await axios({
      method: 'post',
      url: SPOTIFY_TOKEN_URL,
      params: {
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Save tokens to database
    let spotifyAuth = await SpotifyAuth.findOne({ userId });
    
    if (spotifyAuth) {
      // Update existing record
      spotifyAuth.accessToken = access_token;
      spotifyAuth.refreshToken = refresh_token;
      spotifyAuth.expiresAt = expiresAt;
      spotifyAuth.updatedAt = new Date();
      await spotifyAuth.save();
    } else {
      // Create new record
      spotifyAuth = new SpotifyAuth({
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      });
      await spotifyAuth.save();
    }

    if(app === 'web'){
      // Redirect to success page or app
      res.redirect(`${config.get('WebfrontendUrl')}?success=true`);
    }else{
      // Redirect to success page or app
      res.redirect(`${config.get('AppfrontendUrl')}?success=true`);
    }
  } catch (error) {
    console.error('Spotify authentication error:', error.response?.data || error.message);
    res.status(400).send({ 
      success: false, 
      message: 'Failed to authenticate with Spotify' 
    });
  }
});

router.get('/save-code',auth, async (req, res) => {
  const code = req.query.code || null;
  const userId = req.user._id;

  if (!code || !userId) {
    return res.status(400).send({ 
      success: false, 
      message: 'Authorization code or user ID missing' 
    });
  }

  try {
    // Exchange code for access token
    const response = await axios({
      method: 'post',
      url: SPOTIFY_TOKEN_URL,
      params: {
        code: code,
        redirect_uri: 'https://godai-bay.vercel.app/dashboard/quick-access/music',
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Save tokens to database
    let spotifyAuth = await SpotifyAuth.findOne({ userId });
    
    if (spotifyAuth) {
      // Update existing record
      spotifyAuth.accessToken = access_token;
      spotifyAuth.refreshToken = refresh_token;
      spotifyAuth.expiresAt = expiresAt;
      spotifyAuth.updatedAt = new Date();
      await spotifyAuth.save();
    } else {
      // Create new record
      spotifyAuth = new SpotifyAuth({
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      });
      await spotifyAuth.save();
    }

    res.status(200).send({ 
      success: true, 
      spotifyAuth:spotifyAuth
    });
  } catch (error) {
    console.error('Spotify authentication error:', error.response?.data || error.message);
    res.status(400).send({ 
      success: false, 
      message: 'Failed to authenticate with Spotify' 
    });
  }
});

router.post('/save-refresh-token',auth, async (req, res) => {
  const userId = req.user._id;  

  if (!userId) {
    return res.status(400).send({ 
      success: false, 
      message: 'Authorization code or user ID missing' 
    });
  }

  try {

    const { access_token, refresh_token, expires_in } = req.body;
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Save tokens to database
    let spotifyAuth = await SpotifyAuth.findOne({ userId });
    
    if (spotifyAuth) {
      // Update existing record
      spotifyAuth.accessToken = access_token;
      spotifyAuth.refreshToken = refresh_token;
      spotifyAuth.expiresAt = expiresAt;
      spotifyAuth.updatedAt = new Date();
      await spotifyAuth.save();
    } else {
      // Create new record
      spotifyAuth = new SpotifyAuth({
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      });
      await spotifyAuth.save();
    }

    res.status(200).send({ 
      success: true, 
      spotifyAuth:spotifyAuth
    });
  } catch (error) {
    res.status(400).send({ 
      success: false, 
      message: 'Failed to authenticate with Spotify' 
    });
  }
});
// API to refresh the access token (requires authentication)
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Get the user's Spotify refresh token
    const spotifyAuth = await SpotifyAuth.findOne({ userId: req.user._id });
    
    if (!spotifyAuth) {
      return res.status(404).send({ 
        success: false, 
        message: 'Spotify connection not found for this user' 
      });
    }

    // Exchange refresh token for new access token
    const response = await axios({
      method: 'post',
      url: SPOTIFY_TOKEN_URL,
      params: {
        grant_type: 'refresh_token',
        refresh_token: spotifyAuth.refreshToken
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = response.data;
    
    // If a new refresh token is provided, update it
    if (response.data.refresh_token) {
      spotifyAuth.refreshToken = response.data.refresh_token;
    }
    
    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
    // Update access token and expiration
    spotifyAuth.accessToken = access_token;
    spotifyAuth.expiresAt = expiresAt;
    spotifyAuth.updatedAt = new Date();
    
    await spotifyAuth.save();

    // Return new access token
    res.send({
      success: true,
      spotifyAuth:spotifyAuth
    });
    
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(400).send({ 
      success: false, 
      message: 'Failed to refresh Spotify token' 
    });
  }
});

// Get the current user's Spotify connection status
router.get('/status', auth, async (req, res) => {
  try {
    const spotifyAuth = await SpotifyAuth.findOne({ userId: req.user._id });
    
    if (!spotifyAuth) {
      return res.send({
        success: true,
        connected: false
      });
    }

    // Check if token is expired
    const isExpired = new Date() > new Date(spotifyAuth.expiresAt);
    
    res.send({
      success: true,
      connected: true,
      isExpired,
      expiresAt: spotifyAuth.expiresAt
    });
    
  } catch (error) {
    console.error('Error getting Spotify status:', error.message);
    res.status(400).send({ 
      success: false, 
      message: 'Failed to get Spotify connection status' 
    });
  }
});

// Disconnect Spotify
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const result = await SpotifyAuth.findOneAndDelete({ userId: req.user._id });
    
    if (!result) {
      return res.status(404).send({ 
        success: false, 
        message: 'No Spotify connection found for this user' 
      });
    }
    
    res.send({
      success: true,
      message: 'Spotify account disconnected successfully'
    });
    
  } catch (error) {
    console.error('Error disconnecting Spotify:', error.message);
    res.status(400).send({ 
      success: false, 
      message: 'Failed to disconnect Spotify account' 
    });
  }
});

module.exports = router; 