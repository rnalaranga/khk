const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const key = 'AQ.Ab8RN6LTSuWHdgHIS5Hailq0ilH3UqCK5vuNPph4fdwCU3eYUQ';
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
