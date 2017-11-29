/*jshint esversion: 6 */
const express = require('express');
const app = express();
const webpush = require('web-push');
const bodyParser = require('body-parser');
const got = require('got');
const pushKeys = require('./push-keys');

const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.use(bodyParser.json());

app.listen(3000, () => console.log('Example app listening on port 3000!'));


app.get('/', function(req, res){
  res.sendFile('default.html', { root: __dirname + "/" } );
});

webpush.setGCMAPIKey(pushKeys.GCMAPIKey);
webpush.setVapidDetails(
  pushKeys.subject,
  pushKeys.publicKey,
  pushKeys.privateKey
);

app.post('/api/save-subscription/', function (req, res) {
	const isValidSaveRequest = (req, res) => {
	  // Check the request body has at least an endpoint.
	  if (!req.body || !req.body.endpoint) {
	    // Not a valid subscription.
	    res.status(400);
	    res.setHeader('Content-Type', 'application/json');
	    res.send(JSON.stringify({
	      error: {
	        id: 'no-endpoint',
	        message: 'Subscription must have an endpoint.'
	      }
	    }));
	    return false;
	  }
	  return true;
	};

  if (!isValidSaveRequest(req, res)) {
    return;
  }

  savedSubscription = req.body;

  return 'subscription saved';
});

app.get('/api/get-coins', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(coins));
});


function getCryptoData(coin) {
  if(coin.count > 0 && coin.notificationRank === 5) {
    coin.count--;
    return;
  }

  return got(`https://api.coinmarketcap.com/v1/ticker/${coin.name}/?convert=GBP`, { json: true }).then(response => {
    var name = response.body[0].name;
    var percentChange1h = response.body[0].percent_change_1h;
    var percentChange24h = response.body[0].percent_change_24h;
    var payload = {};

    coin.price = response.body[0].price_usd;
    coin.percentChange24h = response.body[0].percent_change_24h;

    if(percentChange1h >= 10) {
      coin.count = 12;
      coin.message = ONE_HOUR_TO_THE_MOON;
      coin.notificationRank = 5;
      payload.title = `${name} to the moon!!! (${percentChange1h}% in 1hr)`;
    } else if(percentChange1h >= 5 && coin.notificationRank < 4) {
      coin.count = 12;
      coin.message = ONE_HOUR_EXPLODIFIED;
      coin.notificationRank = 4;
      payload.title = `${name} has explodified! (${percentChange1h}% in 1hr)`;
    } else if(percentChange24h >= 20 && coin.notificationRank < 3) {
      coin.count = 12;
      coin.message = ONE_DAY_TO_THE_MOON;
      coin.notificationRank = 3;
      payload.title =  `${name} to the moon!!! (${percentChange24h}% in 24hrs)`;
    } else if(percentChange24h >= 10 && coin.notificationRank < 2) {
      coin.count = 12;
      coin.message = ONE_DAY_EXPLODIFIED;
      coin.notificationRank = 2;
      payload.title =  `${name} has explodified! (${percentChange24h}% in 24 hrs)`;
    } else if(percentChange24h >= 5 && coin.notificationRank < 1) {
      coin.count = 12;
      coin.message = ONE_DAY_GOING_UP;
      coin.notificationRank = 1;
      payload.title =  `${name} is going up! (${percentChange24h}% in 24hrs)`;
    } else {
      if(coin.count > 0) {
        coin.count--;
      }
      return;
    }

    payload.message = 'This shit\'s so volatile!!';

    return payload;
  }).catch(error => {
    console.log(error.response.body);
  });
}


const ONE_HOUR_TO_THE_MOON = '1hrToTheMoon';
const ONE_HOUR_EXPLODIFIED = '1hrExpolidified';
const ONE_DAY_TO_THE_MOON = '1DayToTheMoon';
const ONE_DAY_EXPLODIFIED = '1DayExplodified';
const ONE_DAY_GOING_UP = '1DayGoingUp';

let savedSubscription;

let coins = [
  {
    name: 'bitcoin',
    message: '',
    notificationRank: 0,
    count: 0,
    price: 1.1,
    percentChange24h: 0
  },
  {
    name: 'ripple',
    message: '',
    notificationRank: 0,
    count: 0,
    price: 1.1,
    percentChange24h: 0
  },
  {
    name: 'lisk',
    message: '',
    notificationRank: 0,
    count: 0,
    price: 1.1,
    percentChange24h: 0
  },
  {
    name: 'verge',
    message: '',
    notificationRank: 0,
    count: 0,
    price: 1.1,
    percentChange24h: 0
  },
  {
    name: 'district0x',
    message: '',
    notificationRank: 0,
    count: 0,
    price: 1.1,
    percentChange24h: 0
  }
];

setInterval(function() {
  if(!savedSubscription) {
    return;
  }

  coins.forEach((coin) => {
    getCryptoData(coin).then((payload) => {
      if(payload) {
        webpush.sendNotification(savedSubscription, JSON.stringify(payload));
      }
    });
  });
}, 5000);
