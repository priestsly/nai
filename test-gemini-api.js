const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyAo4Ni8NeU0SOkFjTn_Mnx_VL5u8apC_eM');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function testAPI() {
  try {
    console.log('Testing Gemini API connection...');
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log('API test successful');
    console.log('Response:', response.text());
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();