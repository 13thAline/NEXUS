require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
model.embedContent('hello').then(res => console.log(res.embedding.values.slice(0,3))).catch(e => console.error(e.message));
