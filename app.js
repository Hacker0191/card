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