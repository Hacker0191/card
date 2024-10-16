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

    if (now.toMillis() < cardData.deliveryDate.toMillis()) {
      return res.status(403).send('This card is not yet accessible');
    }

    res.render('card', { card: cardData });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).send('An error occurred while fetching the card');
  }
});

module.exports = router;