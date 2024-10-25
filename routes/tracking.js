const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

// Add this new route for handling undo
router.post('/:id/undo', async (req, res) => {
  try {
    const { id } = req.params;
    const cardDoc = await admin.firestore().collection('cards').doc(id).get();
    
    if (!cardDoc.exists) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const cardData = cardDoc.data();
    
    if (!cardData.canUndo || cardData.undoExpiresAt.toDate() < new Date()) {
      return res.status(400).json({ success: false, message: 'Undo period expired' });
    }

    // Delete the card
    await admin.firestore().collection('cards').doc(id).delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error undoing card:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update the existing route to handle timezone correctly
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const cardDoc = await admin.firestore().collection('cards').doc(id).get();
    
    if (!cardDoc.exists) {
      return res.status(404).send('Card not found');
    }

    const cardData = cardDoc.data();
    const now = admin.firestore.Timestamp.now();
    
    // Calculate progress based on UTC times
    const totalTime = cardData.deliveryDate.toDate().getTime() - cardData.createdAt.toDate().getTime();
    const elapsedTime = now.toDate().getTime() - cardData.createdAt.toDate().getTime();
    const progress = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100);

    let status;
    if (progress < 25) {
      status = 'Preparing for dispatch';
    } else if (progress < 50) {
      status = 'Left sender\'s country';
    } else if (progress < 75) {
      status = 'Arrived in receiver\'s country';
    } else {
      status = 'Delivered';
    }

    await admin.firestore().collection('cards').doc(id).update({ status });

    res.render('tracking', {
      trackingData: {
        ...cardData,
        status,
        progress: Math.round(progress),
      }
    });
  } catch (error) {
    console.error('Error fetching card for tracking:', error);
    res.status(500).send('An error occurred while fetching the card tracking information');
  }
});

module.exports = router;