// Test vector search functionality
const testVectorSearch = async () => {
  try {
    console.log('🧪 Testing vector search functionality...');
    
    // Test 1: Check if intent generates subject_line parameter
    console.log('\n1. Testing intent analysis...');
    const intentResponse = await fetch('http://localhost:3000/api/chat/intent-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: 'Find subject lines similar to "Exciting News: Lower APR Available Now!"',
        originalSubjectLine: null
      })
    });
    
    const intentResult = await intentResponse.json();
    console.log('Intent response:', JSON.stringify(intentResult, null, 2));
    
    if (intentResult.facets && intentResult.facets.length > 0) {
      const facet = intentResult.facets[0];
      console.log(`Facet type: ${facet.type}`);
      console.log(`Subject line param: ${facet.subject_line}`);
      console.log(`SQL: ${facet.sql}`);
      
      if (facet.subject_line) {
        console.log('✅ Intent generated subject_line parameter!');
        
        // Test 2: Check if query-sql uses vector search
        console.log('\n2. Testing vector search execution...');
        const queryResponse = await fetch('http://localhost:3000/api/data/query-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: facet.sql,
            subject_line: facet.subject_line
          })
        });
        
        const queryResult = await queryResponse.json();
        console.log('Query response status:', queryResponse.status);
        console.log('Query result:', JSON.stringify(queryResult, null, 2));
        
        if (queryResult.contextText && queryResult.contextText.includes('Here are the results')) {
          console.log('✅ Vector search returned results!');
          console.log('Context text:', queryResult.contextText);
        } else {
          console.log('❌ No results from vector search');
        }
      } else {
        console.log('❌ Intent did not generate subject_line parameter');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testVectorSearch();
