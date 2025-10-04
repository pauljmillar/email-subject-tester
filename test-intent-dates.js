// Test the updated intent prompt with date context
const testIntentDates = async () => {
  try {
    console.log('🧪 Testing intent prompt with date context...');
    
    const response = await fetch('http://localhost:3000/api/chat/intent-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: 'How many Chase emails were sent in July?',
        originalSubjectLine: null
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Intent response:', JSON.stringify(result, null, 2));
    
    if (result.facets && result.facets.length > 0) {
      const sql = result.facets[0].sql;
      console.log('Generated SQL:', sql);
      
      // Check if it uses 2025 dates
      if (sql.includes('2025')) {
        console.log('✅ SQL uses correct 2025 dates!');
      } else if (sql.includes('2024')) {
        console.log('❌ SQL still uses 2024 dates');
      } else {
        console.log('⚠️ SQL has no date references');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testIntentDates();
