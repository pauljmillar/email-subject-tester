// Test additional SQL security measures
const testAdditionalSecurity = async () => {
  const testCases = [
    {
      name: 'System table access attempt',
      sql: 'SELECT * FROM INFORMATION_SCHEMA.TABLES',
      shouldPass: false
    },
    {
      name: 'PostgreSQL system table access',
      sql: 'SELECT * FROM PG_TABLES',
      shouldPass: false
    },
    {
      name: 'System function call',
      sql: 'SELECT SP_HELP FROM subject_lines',
      shouldPass: false
    },
    {
      name: 'Oversized query (DoS attempt)',
      sql: 'SELECT ' + 'subject_line, '.repeat(2000) + 'company FROM subject_lines',
      shouldPass: false
    },
    {
      name: 'Valid complex SELECT query',
      sql: 'SELECT subject_line, company, open_rate FROM subject_lines WHERE company = \'Chase\' ORDER BY open_rate DESC LIMIT 10',
      shouldPass: true
    }
  ];

  console.log('🔒 Testing Additional SQL Security Measures...\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`SQL: ${testCase.sql.substring(0, 100)}${testCase.sql.length > 100 ? '...' : ''}`);
      
      const response = await fetch('http://localhost:3000/api/data/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: testCase.sql })
      });
      
      const result = await response.json();
      
      if (testCase.shouldPass) {
        if (response.ok) {
          console.log('✅ PASSED (as expected)');
        } else {
          console.log('❌ FAILED (should have passed)');
          console.log(`Error: ${result.error}`);
        }
      } else {
        if (!response.ok && (result.error.includes('blocked') || result.error.includes('too long'))) {
          console.log('✅ BLOCKED (as expected)');
        } else {
          console.log('❌ SECURITY FAILURE (should have been blocked!)');
          console.log(`Response: ${JSON.stringify(result)}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
    }
    
    console.log('---\n');
  }
};

testAdditionalSecurity();
