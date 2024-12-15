const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const admin = require('../config/firebase');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');
const upload = multer({ storage });
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const YouTubeMusic = require('youtube-music-api');

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




// Initialize YouTube Music API
const ytMusic = new YouTubeMusic();

// Middleware to initialize YouTube Music API
async function initYouTubeMusic(req, res, next) {
  try {
    await ytMusic.initialize();
    next();
  } catch (error) {
    console.error('YouTube Music API Initialization Error:', error);
    res.status(500).json({ error: 'Failed to initialize YouTube Music API' });
  }
}

// YouTube Music search route
router.get('/search-song', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    // Search YouTube for music tracks
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} music`,
        type: 'video',
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 10,
        videoCategoryId: '10' // Music category
      }
    });

    // Process tracks
    const tracks = searchResponse.data.items.map(item => ({
      name: item.snippet.title,
      artist: item.snippet.channelTitle,
      albumArt: item.snippet.thumbnails.high.url,
      youtubeId: item.id.videoId,
      externalUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    console.log('Tracks found:', tracks);
    res.json({ tracks });
  } catch (error) {
    console.error('Error searching for songs:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'An error occurred while searching for songs',
      details: error.message 
    });
  }
});

module.exports = router;