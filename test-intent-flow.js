// Test script for the intent flow
const testIntentFlow = async () => {
  console.log('=== TESTING INTENT FLOW ===');
  
  // Step 1: Test intent analysis
  console.log('Step 1: Testing intent analysis...');
  const intentResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "This is a subject line I'm considering: 'Welcome to Zelle® at Chase'. Provide suggestions for higher engagement.",
      originalSubjectLine: "Welcome to Zelle® at Chase"
    })
  });
  
  if (!intentResponse.ok) {
    console.error('Intent API failed:', await intentResponse.text());
    return;
  }
  
  const intentData = await intentResponse.json();
  console.log('Intent result:', JSON.stringify(intentData, null, 2));
  
  // Step 2: Test query execution
  if (intentData.facets && intentData.facets.length > 0) {
    console.log('Step 2: Testing query execution...');
    const facet = intentData.facets[0];
    console.log('Testing facet:', facet.type);
    
    const queryResponse = await fetch('http://localhost:3000/api/data/query-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      facetType: facet.type,
      parameters: facet.parameters,
      subjectLine: facet.subject_line
    })
    });
    
    if (!queryResponse.ok) {
      console.error('Query API failed:', await queryResponse.text());
    } else {
      const queryData = await queryResponse.json();
      console.log('Query result:', queryData);
    }
  }
  
  // Step 3: Test chat API
  console.log('Step 3: Testing chat API...');
  const chatResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What are recent successful subject lines?",
      isInitialRequest: false,
      contextText: "Here are some successful subject lines from our database:\n1. \"Your credit card promotional rate expires soon\" (Open Rate: 100.0%)\n2. \"You are approved!\" (Open Rate: 100.0%)"
    })
  });
  
  if (!chatResponse.ok) {
    console.error('Chat API failed:', await chatResponse.text());
  } else {
    const chatData = await chatResponse.json();
    console.log('Chat result:', chatData.response.substring(0, 200) + '...');
  }
  
  console.log('=== END TEST ===');
};

testIntentFlow().catch(console.error);
