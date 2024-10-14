const axios = require('axios');
require('dotenv').config();

const winnerClient = axios.create({
  baseURL: process.env.WINNER_FLEX_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.WINNER_FLEX_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

console.log(winnerClient)
