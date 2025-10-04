// Test script for different intent types
const testIntents = async () => {
  console.log('=== TESTING DIFFERENT INTENT TYPES ===');
  
  // Test 1: Volume intent
  console.log('\n1. Testing VOLUME intent...');
  const volumeResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "What are the biggest email campaigns by volume?",
      originalSubjectLine: null
    })
  });
  
  if (volumeResponse.ok) {
    const volumeData = await volumeResponse.json();
    console.log('Volume intent result:', JSON.stringify(volumeData, null, 2));
  }
  
  // Test 2: Open rates intent
  console.log('\n2. Testing OPEN_RATES intent...');
  const openRatesResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "What are the most successful subject lines with highest open rates?",
      originalSubjectLine: null
    })
  });
  
  if (openRatesResponse.ok) {
    const openRatesData = await openRatesResponse.json();
    console.log('Open rates intent result:', JSON.stringify(openRatesData, null, 2));
  }
  
  // Test 3: Subject line intent
  console.log('\n3. Testing SUBJECT_LINE intent...');
  const subjectLineResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "This is a subject line I'm considering: 'Get 50% off your next purchase'. Provide suggestions for higher engagement.",
      originalSubjectLine: "Get 50% off your next purchase"
    })
  });
  
  if (subjectLineResponse.ok) {
    const subjectLineData = await subjectLineResponse.json();
    console.log('Subject line intent result:', JSON.stringify(subjectLineData, null, 2));
  }
  
  console.log('\n=== END TEST ===');
};

testIntents().catch(console.error);
