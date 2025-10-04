// Test script to check database connection and data
const testDatabase = async () => {
  console.log('=== TESTING DATABASE CONNECTION ===');
  
  try {
    // Test a simple query to see if database is accessible
    const response = await fetch('http://localhost:3000/api/data/query-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facetType: 'open_rates',
        parameters: {}
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Database query result:', data);
      console.log('Context text length:', data.contextText?.length || 0);
      
      // Check if it's fallback context
      if (data.contextText?.includes('Based on our email marketing database, here are some general insights')) {
        console.log('❌ Database query is returning fallback context - likely no data or connection issue');
      } else {
        console.log('✅ Database query returned actual data');
      }
    } else {
      console.error('Database query failed:', await response.text());
    }
  } catch (error) {
    console.error('Database test error:', error);
  }
  
  console.log('=== END TEST ===');
};

testDatabase().catch(console.error);
