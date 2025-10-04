// Test the updated intent prompt with correct columns
const testIntentColumns = async () => {
  try {
    console.log('🧪 Testing intent prompt with correct columns...');
    
    const response = await fetch('http://localhost:3000/api/chat/intent-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: 'Show me Capital One campaigns with their volumes and dates',
        originalSubjectLine: null
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Intent response:', JSON.stringify(result, null, 2));
    
    if (result.facets && result.facets.length > 0) {
      const sql = result.facets[0].sql;
      console.log('Generated SQL:', sql);
      
      // Check if it uses correct columns
      if (sql.includes('campaign_name')) {
        console.log('❌ SQL still uses non-existent campaign_name column');
      } else if (sql.includes('subject_line') || sql.includes('projected_volume') || sql.includes('date_sent')) {
        console.log('✅ SQL uses correct existing columns!');
      } else {
        console.log('⚠️ SQL has no column references');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testIntentColumns();
