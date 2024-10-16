const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const admin = require('../config/firebase');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Render index page
router.get('/', (req, res) => {
  res.render('index');
});

// Route to create a card
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

    // Generate unique card ID and timestamps
    const cardId = uuidv4();
    const createdAt = admin.firestore.Timestamp.now();
    const deliveryTimestamp = new Date(deliveryDate);  // Store as a string (ISO format)

    // Initialize URLs for uploaded files
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

    // Prepare card data to store in Firestore
    const cardData = {
      id: cardId,
      senderName,
      senderCountry,
      receiverName,
      receiverCountry,
      message,
      selectedSong: parsedSong,
      createdAt,
      deliveryDate: deliveryTimestamp.toISOString(),  // Store as ISO date string
      status: 'Preparing for dispatch',
      imageUrl: imageUrl || null,
      voiceNoteUrl: voiceNoteUrl || null
    };

    // Store the card in Firestore
    await admin.firestore().collection('cards').doc(cardId).set(cardData, { merge: true });

    // Redirect to tracking page
    res.redirect(`/tracking/${cardId}`);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).send(`An error occurred while creating the card: ${error.message}`);
  }
});

// Route to track the card using card ID
router.get('/tracking/:cardId', async (req, res) => {
  const { cardId } = req.params;
  try {
    // Fetch the card data from Firestore
    const cardSnapshot = await admin.firestore().collection('cards').doc(cardId).get();

    if (!cardSnapshot.exists) {
      return res.status(404).send('Card not found');
    }

    const cardData = cardSnapshot.data();

    // Parse the delivery date from the stored ISO string
    const deliveryDate = new Date(cardData.deliveryDate);

    // Compare the current date with the delivery date
    const currentDate = new Date();
    let deliveryStatus = 'Not delivered yet';

    if (currentDate >= deliveryDate) {
      deliveryStatus = 'Delivered';
    }

    // Render the tracking page with card details and delivery status
    res.render('tracking', {
      cardId,
      cardData,
      deliveryDate: deliveryDate.toDateString(),  // Format date for display
      deliveryStatus
    });
  } catch (error) {
    console.error('Error fetching card tracking data:', error);
    res.status(500).send('An error occurred while fetching tracking data.');
  }
});

// Route to search for songs (example using Last.fm API)
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
