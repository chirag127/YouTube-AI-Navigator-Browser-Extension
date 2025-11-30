import { readFileSync } from 'fs';

try {
  const r = JSON.parse(readFileSync('test-results.json', 'utf8'));
  const f = r.testResults.filter(t => t.status === 'failed');
  if (f.length === 0 && r.numFailedTests === 0) {
    console.log('PASS');
    process.exit(0);
  }
  f.forEach(t => {
    if (t.assertionResults.length > 0) {
      t.assertionResults.forEach(a => {
        if (a.status === 'failed') {
          console.log(`FAIL: ${a.fullName}`);
          console.log(a.failureMessages[0].split('\n').slice(0, 2).join('\n'));
        }
      });
    } else {
      console.log(`FAIL: ${t.name} - ${t.message}`);
    }
  });
  process.exit(1);
} catch (e) {
  console.log(`Error: ${e.message}`);
  process.exit(1);
}
