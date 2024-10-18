require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('./config/firebase'); // Add this line to import Firebase admin

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
const indexRouter = require('./routes/index');
const cardRouter = require('./routes/card');
const trackingRouter = require('./routes/tracking');

// Use routers
app.use('/', indexRouter);
app.use('/card', cardRouter);
app.use('/tracking', trackingRouter);

// New route for displaying cards
app.get('/cards/:template/:cardId', async (req, res) => {
  try {
    const { template, cardId } = req.params;
    
    // Fetch card data from Firestore
    const cardDoc = await admin.firestore().collection('cards').doc(cardId).get();
    
    if (!cardDoc.exists) {
      return res.status(404).send('Card not found');
    }
    
    const cardData = cardDoc.data();
    
    // Determine which template to use
    let templateFile;
    switch (template) {
      case '2':
        templateFile = 'cards/2.ejs'; // Christmas theme
        break;
      case '3':
        templateFile = 'cards/3.ejs'; // New Year theme
        break;
      default:
        templateFile = 'cards/1.ejs'; // Default theme
    }
    
    // Render the appropriate template with the card data
    res.render(templateFile, { card: cardData });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).send('An error occurred while fetching the card');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});