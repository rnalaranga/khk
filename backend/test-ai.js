const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const key = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KiO2w9bxAOatdTWrhGHKStXWy6Vj-69tOumOZIIP9-Ng';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
