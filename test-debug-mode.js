// Test script to verify debug mode functionality
const testDebugMode = async () => {
  console.log('=== TESTING DEBUG MODE ===');
  
  // Test 1: Intent analysis with debug output
  console.log('Test 1: Testing intent analysis...');
  const intentResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userPrompt: "What are Capital One's biggest campaigns?",
      originalSubjectLine: null
    })
  });
  
  if (!intentResponse.ok) {
    console.error('Intent API failed:', await intentResponse.text());
    return;
  }

  const intentData = await intentResponse.json();
  console.log('Intent result:', intentData);

  // Test 2: Query execution with debug output
  if (intentData.facets && intentData.facets.length > 0) {
    console.log('Test 2: Testing query execution...');
    const facet = intentData.facets[0];
    
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
      const queryResult = await queryResponse.json();
      console.log('Query result context length:', queryResult.contextText?.length || 0);
      console.log('Query result preview:', queryResult.contextText?.substring(0, 200) || 'N/A');
    }
  }
  
  console.log('=== END DEBUG MODE TEST ===');
};

testDebugMode();
