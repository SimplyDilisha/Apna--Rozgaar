// Test Gemini API
const API_KEY = 'AIzaSyAbPTgf0_NMW9LDK4oZMwdjLB8sLlTXgMI';

async function testGemini() {
  // Primary model used by the app, plus fallbacks
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];
  
  for (const model of models) {
    console.log(`\nTesting ${model}...`);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in one sentence.' }] }]
        })
      });
      const data = await response.json();
      console.log('Status:', response.status);
      if (response.ok) {
        console.log('✓ SUCCESS with', model);
        console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        return model;
      } else {
        console.log('Error:', data.error?.message || JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
  console.log('\nAll models failed :(');
}

testGemini();
