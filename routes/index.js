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

// Utility function to compress image
async function compressImage(file) {
  const tempOutput = path.join(os.tmpdir(), `compressed-${file.filename}`);
  await sharp(file.path)
    .jpeg({ quality: 80 }) // Compress JPEG to 80% quality
    .png({ compressionLevel: 8 }) // Compress PNG with level 8 compression
    .resize(1920, 1080, { 
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFile(tempOutput);
  
  return tempOutput;
}

// Utility function to compress video
async function compressVideo(file) {
  const tempOutput = path.join(os.tmpdir(), `compressed-${file.filename}`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .outputOptions([
        '-c:v libx264',     // Use H.264 codec
        '-crf 28',          // Compression quality (23-28 is good balance)
        '-preset faster',    // Encoding speed preset
        '-c:a aac',         // Audio codec
        '-b:a 128k',        // Audio bitrate
        '-movflags +faststart',
        '-y'
      ])
      .output(tempOutput)
      .on('end', () => resolve(tempOutput))
      .on('error', (err) => reject(err))
      .run();
  });
}

// Utility function to compress audio
async function compressAudio(file) {
  const tempOutput = path.join(os.tmpdir(), `compressed-${file.filename}`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .outputOptions([
        '-c:a libmp3lame',  // Use MP3 codec
        '-b:a 128k',        // Audio bitrate
        '-y'
      ])
      .output(tempOutput)
      .on('end', () => resolve(tempOutput))
      .on('error', (err) => reject(err))
      .run();
  });
}

router.post('/create-card', upload.fields([
  { name: 'image', maxCount: 2 },
  { name: 'video', maxCount: 1 },
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

    let imageUrl, videoUrl, voiceNoteUrl;

    // Process and compress image if uploaded
    if (req.files['image']) {
      const compressedImagePath = await compressImage(req.files['image'][0]);
      const uploadResult = await cloudinary.uploader.upload(compressedImagePath, {
        quality: 'auto:low', // Additional Cloudinary compression
        fetch_format: 'auto'
      });
      imageUrl = uploadResult.secure_url;
      await fs.unlink(compressedImagePath); // Clean up temp file
    }

    // Process and compress video if uploaded
    if (req.files['video']) {
      const compressedVideoPath = await compressVideo(req.files['video'][0]);
      const uploadResult = await cloudinary.uploader.upload(compressedVideoPath, {
        resource_type: 'video',
        quality: 'auto:low' // Additional Cloudinary compression
      });
      videoUrl = uploadResult.secure_url;
      await fs.unlink(compressedVideoPath); // Clean up temp file
    }

    // Process and compress voice note if uploaded
    if (req.files['voiceNote']) {
      const compressedAudioPath = await compressAudio(req.files['voiceNote'][0]);
      const uploadResult = await cloudinary.uploader.upload(compressedAudioPath, {
        resource_type: 'video',
        quality: 'auto:low' // Additional Cloudinary compression
      });
      voiceNoteUrl = uploadResult.secure_url;
      await fs.unlink(compressedAudioPath); // Clean up temp file
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
      videoUrl: videoUrl || null,
      voiceNoteUrl: voiceNoteUrl || null,
      theme
    };

    await admin.firestore().collection('cards').doc(cardId).set(cardData, { merge: true });

    // Clean up original uploaded files
    for (const fileArray of Object.values(req.files)) {
      for (const file of fileArray) {
        await fs.unlink(file.path);
      }
    }

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