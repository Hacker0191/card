// routes/tracking.js
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
    
    // Calculate progress based on UTC times
    const createdAtDate = cardData.createdAt.toDate();
    const deliveryDate = cardData.deliveryDate.toDate();
    const currentDate = now.toDate();
    
    // Calculate total duration and elapsed time in milliseconds
    const totalDuration = deliveryDate.getTime() - createdAtDate.getTime();
    const elapsedTime = currentDate.getTime() - createdAtDate.getTime();
    
    // Calculate progress percentage
    let progress = Math.min(Math.max((elapsedTime / totalDuration) * 100, 0), 100);
    progress = Math.round(progress); // Round to nearest integer
    
    // Determine status based on progress
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

    // Update status in Firestore
    await admin.firestore().collection('cards').doc(id).update({
      status,
      progress
    });

    // Format delivery date and time for display
    const formattedDeliveryDate = deliveryDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    res.render('tracking', {
      trackingData: {
        ...cardData,
        status,
        progress,
        formattedDeliveryDate,
        id
      }
    });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).send('An error occurred while fetching the card');
  }
});

module.exports = router;