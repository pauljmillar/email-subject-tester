// Test the API with a simple request
const testSimpleAPI = async () => {
  try {
    console.log('🧪 Testing simple API request...');
    
    const response = await fetch('http://localhost:3000/api/data/query-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT subject_line FROM subject_lines LIMIT 3',
        subject_line: 'test'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testSimpleAPI();
