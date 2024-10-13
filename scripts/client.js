const express = require('express');
const app = express();

app.use(express.json());

const winnerClient = axios.create({
    baseURL: process.env.WINNER_BASE_URL,
    headers: {
      'Authorization': `Bearer ${process.env.WINNER_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
