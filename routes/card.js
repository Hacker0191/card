// routes/card.js

const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

// Get reactions for a card
router.get('/:cardId/reactions', async (req, res) => {
  try {
    const { cardId } = req.params;
    const reactionsDoc = await admin.firestore()
      .collection('cards')
      .doc(cardId)
      .collection('reactions')
      .get();
    
    const reactions = {};
    reactionsDoc.docs.forEach(doc => {
      const data = doc.data();
      if (!reactions[data.emoji]) reactions[data.emoji] = [];
      reactions[data.emoji].push({ id: doc.id, ...data });
    });
    
    res.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Add a reaction to a card
router.post('/:cardId/reactions', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { emoji, userName } = req.body;
    
    const reactionRef = await admin.firestore()
      .collection('cards')
      .doc(cardId)
      .collection('reactions')
      .add({
        emoji,
        userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({ id: reactionRef.id, emoji, userName });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Get replies for a card
router.get('/:cardId/replies', async (req, res) => {
  try {
    const { cardId } = req.params;
    const repliesSnapshot = await admin.firestore()
      .collection('cards')
      .doc(cardId)
      .collection('replies')
      .orderBy('timestamp', 'desc')
      .get();
    
    const replies = repliesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Add a reply to a card
router.post('/:cardId/replies', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { message, userName } = req.body;
    
    const replyRef = await admin.firestore()
      .collection('cards')
      .doc(cardId)
      .collection('replies')
      .add({
        message,
        userName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({ id: replyRef.id, message, userName });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;