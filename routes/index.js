const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const admin = require('../config/firebase');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');
const upload = multer({ storage });

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
      deliveryDate,  // Keep this as a string
      message,
      selectedSong
    } = req.body;
    
    const cardId = uuidv4();
    const createdAt = admin.firestore.Timestamp.now();

    let imageUrl, voiceNoteUrl;

    // Handle file uploads for image and voice note
    if (req.files['image']) {
      imageUrl = req.files['image'][0].path;
    }
  
    if (req.files['voiceNote']) {
      voiceNoteUrl = req.files['voiceNote'][0].path;
    }

    // Attempt to parse the selected song if present
    let parsedSong;
    try {
      parsedSong = JSON.parse(selectedSong);
    } catch (error) {
      console.error('Error parsing selectedSong:', error);
      parsedSong = null;
    }

    // Prepare the card data to be saved
    const cardData = {
      id: cardId,
      senderName,
      senderCountry,
      receiverName,
      receiverCountry,
      message,
      selectedSong: parsedSong,  // Store parsed song data
      createdAt,
      deliveryDate,  // Store the raw delivery date string to avoid timezone issues
      status: 'Preparing for dispatch',
      imageUrl: imageUrl || null,
      voiceNoteUrl: voiceNoteUrl || null
    };

    // Save the card data to Firestore
    await admin.firestore().collection('cards').doc(cardId).set(cardData, { merge: true });

    // Redirect to the tracking page
    res.redirect(`/tracking/${cardId}`);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).send(`An error occurred while creating the card: ${error.message}`);
  }
});

router.get('/search-song', async (req, res) => {
  const { query } = req.query;
  try {
    // Call the Last.fm API to search for songs
    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${process.env.LASTFM_API_KEY}&format=json`);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching for songs:', error);
    res.status(500).json({ error: 'An error occurred while searching for songs' });
  }
});

module.exports = router;
