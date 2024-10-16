const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const cardDoc = await admin.firestore().collection('cards').doc(id).get();
    
    if (!cardDoc.exists) {
      return res.status(404).send('Card not found');
    }

    const cardData = cardDoc.data();
    const now = admin.firestore.Timestamp.now();
    const totalTime = cardData.deliveryDate.toMillis() - cardData.createdAt.toMillis();
    const elapsedTime = now.toMillis() - cardData.createdAt.toMillis();
    const progress = Math.min(elapsedTime / totalTime, 1);

    let status;
    if (progress < 0.25) {
      status = 'Preparing for dispatch';
    } else if (progress < 0.5) {
      status = 'Left sender\'s country';
    } else if (progress < 0.99) {
      status = 'Arrived in receiver\'s country';
    } else {
      status = 'Delivered';
    }

    // Update the status in Firebase
    await admin.firestore().collection('cards').doc(id).update({ status });

    res.render('tracking', { 
      trackingData: {
        ...cardData,
        status,
        progress: Math.round(progress * 100)
      }
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).send('An error occurred while fetching tracking data');
  }
});

module.exports = router;
