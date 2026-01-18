// test-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Di solo 'funciona perfectamente'");
    const response = await result.response;
    console.log('✅ Gemini funciona:', response.text());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();