// Test script for recent volume query
const testRecentVolume = async () => {
  console.log('=== TESTING RECENT VOLUME QUERY ===');
  
  // Step 1: Test intent analysis
  console.log('Step 1: Testing intent analysis...');
  const intentResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "What are recent high volume campaigns sent by Credit Karma recently?",
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
      
      // Check if it's actual data or fallback
      if (queryData.contextText?.includes('Here are the highest-volume email campaigns')) {
        console.log('✅ Query returned actual volume data');
      } else {
        console.log('❌ Query returned fallback context');
      }
    }
  }
  
  console.log('=== END TEST ===');
};

testRecentVolume().catch(console.error);
