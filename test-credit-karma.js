// Test script for Credit Karma volume query
const testCreditKarmaVolume = async () => {
  console.log('=== TESTING CREDIT KARMA VOLUME QUERY ===');
  
  // Step 1: Test intent analysis
  console.log('Step 1: Testing intent analysis...');
  const intentResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "What are Credit Karma's biggest emails from last month?",
      originalSubjectLine: null
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
        parameters: facet.parameters
      })
    });
    
    if (!queryResponse.ok) {
      console.error('Query API failed:', await queryResponse.text());
    } else {
      const queryData = await queryResponse.json();
      console.log('Query result context length:', queryData.contextText?.length || 0);
      console.log('Query result preview:', queryData.contextText?.substring(0, 300));
    }
  }
  
  // Step 3: Test chat API
  console.log('Step 3: Testing chat API...');
  const chatResponse = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What are Credit Karma's biggest emails from last month?",
      isInitialRequest: false,
      contextText: "Here are the highest-volume email campaigns from our database:\n1. \"[REDACTED] the APY has changed on your Credit Karma Money™ Save account.\" (Volume: 1,843,117, Company: Credit Karma)\n2. \"[REDACTED] credit score has been impacted.\" (Volume: 338,582, Company: Credit Karma)\n3. \"Check to see if you're $5,000 richer, [REDACTED]\" (Volume: 291,483, Company: Credit Karma)"
    })
  });
  
  if (!chatResponse.ok) {
    console.error('Chat API failed:', await chatResponse.text());
  } else {
    const chatData = await chatResponse.json();
    console.log('Chat result preview:', chatData.response?.substring(0, 300));
  }
  
  console.log('=== END TEST ===');
};

testCreditKarmaVolume().catch(console.error);
