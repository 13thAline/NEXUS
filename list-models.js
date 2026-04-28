require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
genAI.getGenerativeModel({ model: 'text-embedding-004' });
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
.then(res => res.json())
.then(data => {
  const models = data.models.filter(m => m.name.includes('embed'));
  console.log(models.map(m => m.name));
});
