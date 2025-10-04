// Test the updated intent prompt with comparison questions
const testComparisonIntent = async () => {
  try {
    console.log('🧪 Testing intent prompt with comparison question...');
    
    const response = await fetch('http://localhost:3000/api/chat/intent-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: 'Did Credit Karma send more emails in July or August?',
        originalSubjectLine: null
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Intent response:', JSON.stringify(result, null, 2));
    
    if (result.facets && result.facets.length > 0) {
      console.log(`Number of facets: ${result.facets.length}`);
      
      result.facets.forEach((facet, index) => {
        console.log(`Facet ${index + 1}:`);
        console.log(`  Type: ${facet.type}`);
        console.log(`  SQL: ${facet.sql}`);
        
        // Check if it's a comparison (should have 2 facets)
        if (result.facets.length === 2) {
          console.log('✅ Generated 2 facets for comparison!');
        } else if (result.facets.length === 1) {
          console.log('⚠️ Only 1 facet - might not be optimal for comparison');
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testComparisonIntent();
