// Test script to check volume data in database
const testVolume = async () => {
  console.log('=== TESTING VOLUME DATA ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/data/query-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facetType: 'volume',
        parameters: {}
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Volume query result:', data);
      console.log('Context text length:', data.contextText?.length || 0);
      console.log('Context text preview:', data.contextText?.substring(0, 200));
    } else {
      console.error('Volume query failed:', await response.text());
    }
  } catch (error) {
    console.error('Test error:', error);
  }
  
  console.log('=== END TEST ===');
};

testVolume().catch(console.error);
