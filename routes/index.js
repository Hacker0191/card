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
      deliveryDate,
      message,
      selectedSong
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
      selectedSong: selectedSong ? JSON.parse(selectedSong) : null,
      createdAt,
      deliveryDate: deliveryTimestamp,
      status: 'Preparing for dispatch',
      imageUrl: imageUrl || null,
      voiceNoteUrl: voiceNoteUrl || null
    };

    if (imageUrl) cardData.imageUrl = imageUrl;
    if (voiceNoteUrl) cardData.voiceNoteUrl = voiceNoteUrl;

    await admin.firestore().collection('cards').doc(cardId).set(cardData, { merge: true });
    res.redirect(`/tracking/${cardId}`);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).send(`An error occurred while creating the card: ${error.message}`);
  }
});

router.get('/search-song', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${process.env.LASTFM_API_KEY}&format=json`);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching for songs:', error);
    res.status(500).json({ error: 'An error occurred while searching for songs' });
  }
});

module.exports = router;