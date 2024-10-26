const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const admin = require('../config/firebase');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');
const upload = multer({ storage });
const SpotifyWebApi = require('spotify-web-api-node');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

router.get('/', (req, res) => {
  res.render('index');
});

router.post('/create-card', upload.fields([
  { name: 'image', maxCount: 2 },
  { name: 'voiceNote', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      senderName,
      senderCountry,
      receiverName,
      receiverCountry,
      deliveryDate,
      message,
      selectedSong,
      theme
    } = req.body;

    const cardId = uuidv4();
    const createdAt = admin.firestore.Timestamp.now();
    const deliveryTimestamp = admin.firestore.Timestamp.fromDate(new Date(deliveryDate));

    let imageUrl, voiceNoteUrl;

    if (req.files['image']) {
      imageUrl = req.files['image'][0].path;
    }

    if (req.files['voiceNote']) {
      voiceNoteUrl = req.files['voiceNote'][0].path;
    }

    let parsedSong;
    try {
      parsedSong = JSON.parse(selectedSong);
    } catch (error) {
      console.error('Error parsing selectedSong:', error);
      parsedSong = null;
    }

    const cardData = {
      id: cardId,
      senderName,
      senderCountry,
      receiverName,
      receiverCountry,
      message,
      selectedSong: parsedSong,
      createdAt,
      deliveryDate: deliveryTimestamp,
      status: 'Preparing for dispatch',
      imageUrl: imageUrl || null,
      voiceNoteUrl: voiceNoteUrl || null,
      theme
    };

    await admin.firestore().collection('cards').doc(cardId).set(cardData, { merge: true });

    // Redirect to the tracking page
    res.redirect(`/tracking/${cardId}`);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).send(`An error occurred while creating the card: ${error.message}`);
  }
});

router.get('/card/:cardId', async (req, res) => {
  try {
    const cardId = req.params.cardId;
    const cardDoc = await admin.firestore().collection('cards').doc(cardId).get();
    
    if (!cardDoc.exists) {
      return res.status(404).send('Card not found');
    }

    const cardData = cardDoc.data();
    let template;
    switch (cardData.theme) {
      case 'christmas':
        template = '2';
        break;
      case 'newyear':
        template = '3';
        break;
      case 'graduation':
        template = '7';
        break;
      case 'engagement':
        template = '4';
        break;
      case 'anniversary':
        template = '12';
        break;
      case 'birthday':
        template = '16';
        break;
      case 'retirement':
        template = '3';
        break;
      case 'lover':
        template = '5';
        break;
      case 'love':
        template = '13';
        break;
      case 'sorry':
        template = '11';
        break;
      case 'thankyou':
        template = '10';
        break;
      case 'getwell':
        template = '6';
        break;
      case 'congratulations':
        template = '9';
        break;
      case 'goodluck':
        template = '8';
        break;
      case 'backtoschool':
        template = '14';
        break;
      default:
        template = '1';
    }
    
    

    res.render(`cards/${template}`, { cardData });
  } catch (error) {
    console.error('Error fetching card data:', error);
    res.status(500).send(`An error occurred while fetching the card data: ${error.message}`);
  }
});


// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Refresh Spotify access token
async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify access token refreshed');
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
  }
}

// Refresh token every hour
setInterval(refreshSpotifyToken, 3600000);
refreshSpotifyToken(); // Initial token refresh

router.get('/search-song', async (req, res) => {
  const { query } = req.query;
  
  try {
    const searchResults = await spotifyApi.searchTracks(query, {
      limit: 10
    });

    const tracks = searchResults.body.tracks.items.map(track => ({
      name: track.name,
      artist: track.artists[0].name,
      previewUrl: track.preview_url, // 30-second preview URL
      albumArt: track.album.images[0]?.url,
      spotifyId: track.id
    })).filter(track => track.previewUrl); // Only return tracks with preview URLs

    res.json({ tracks });
  } catch (error) {
    console.error('Error searching for songs:', error);
    res.status(500).json({ 
      error: 'An error occurred while searching for songs',
      details: error.message 
    });
  }
});

module.exports = router;
