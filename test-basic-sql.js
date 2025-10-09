// Test basic SQL execution
const testBasicSQL = async () => {
  try {
    console.log('🧪 Testing basic SQL execution...');
    
    const response = await fetch('http://localhost:3000/api/data/query-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT subject_line, company FROM subject_lines LIMIT 3'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.contextText && result.contextText.includes('Here are the results')) {
      console.log('✅ Basic SQL execution working!');
    } else {
      console.log('❌ Basic SQL execution not working');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testBasicSQL();
