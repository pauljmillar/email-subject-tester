// Test the SQL API endpoint
const testSQLAPI = async () => {
  try {
    console.log('🧪 Testing SQL API...');
    
    const response = await fetch('http://localhost:3000/api/data/query-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT EXTRACT(MONTH FROM date_sent) AS month, SUM(projected_volume) AS total_volume FROM subject_lines WHERE company = \'Chase\' AND EXTRACT(YEAR FROM date_sent) = 2025 GROUP BY month ORDER BY total_volume DESC LIMIT 1'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ SQL API is working!');
    } else {
      console.log('❌ SQL API failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testSQLAPI();
