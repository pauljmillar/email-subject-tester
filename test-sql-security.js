// Test SQL security measures
const testSQLSecurity = async () => {
  const testCases = [
    {
      name: 'Valid SELECT query',
      sql: 'SELECT subject_line, company FROM subject_lines LIMIT 3',
      shouldPass: true
    },
    {
      name: 'Dangerous INSERT query',
      sql: 'INSERT INTO subject_lines (subject_line, company) VALUES (\'test\', \'test\')',
      shouldPass: false
    },
    {
      name: 'Dangerous UPDATE query',
      sql: 'UPDATE subject_lines SET company = \'hacked\' WHERE id = 1',
      shouldPass: false
    },
    {
      name: 'Dangerous DELETE query',
      sql: 'DELETE FROM subject_lines WHERE id = 1',
      shouldPass: false
    },
    {
      name: 'Dangerous DROP query',
      sql: 'DROP TABLE subject_lines',
      shouldPass: false
    },
    {
      name: 'Dangerous CREATE query',
      sql: 'CREATE TABLE malicious (id int)',
      shouldPass: false
    },
    {
      name: 'SQL injection attempt',
      sql: 'SELECT * FROM subject_lines; DROP TABLE subject_lines; --',
      shouldPass: false
    },
    {
      name: 'Non-SELECT statement',
      sql: 'SHOW TABLES',
      shouldPass: false
    }
  ];

  console.log('🔒 Testing SQL Security Measures...\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`SQL: ${testCase.sql}`);
      
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
        if (!response.ok && result.error.includes('blocked')) {
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

testSQLSecurity();
