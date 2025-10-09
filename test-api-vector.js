// Test the API directly with vector search
const testAPIVector = async () => {
  try {
    console.log('🧪 Testing API vector search directly...');
    
    const response = await fetch('http://localhost:3000/api/data/query-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: '',
        subject_line: 'Exciting News: Lower APR Available Now!'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.contextText && result.contextText.includes('Here are the results')) {
      console.log('✅ Vector search returned formatted results!');
    } else {
      console.log('❌ No formatted results from vector search');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPIVector();
