import { executeCode } from './src/utils/codeExecutor';
import { NEWTON_SECTION_A_PROBLEMS } from './src/data/eliteNewtonQuestions';

async function runTests() {
  console.log("Checking Section A Problems...");
  let failed = 0;
  for (let i = 0; i < 3; i++) {
    const problem = NEWTON_SECTION_A_PROBLEMS[i];
    console.log(`\nTesting Problem: ${problem.title}`);
    
    // We will construct a dummy solution that just returns the expected output for the test cases
    // to verify the evaluation logic itself.
    // Wait, better yet, we can write a small function that returns hardcoded answers based on inputs.
    // Let's just create a dummy string that returns the expected value of the first test case.
    // Actually, to test if execution is working properly, we need a real JS solution for Q1:
    
    let userCode = '';
    if (problem.id === 'newton_q1') {
      userCode = `
        function solve(root, X) {
          if (!root) return -1;
          let parent = -1;
          const queue = [{ node: root, p: -1 }];
          while (queue.length > 0) {
            const { node, p } = queue.shift();
            if (node.val === X) return p;
            if (node.left) queue.push({ node: node.left, p: node.val });
            if (node.right) queue.push({ node: node.right, p: node.val });
          }
          return -1;
        }
      `;
    } else {
       // just pass the execution test by returning the exact expected string for the test case
       userCode = `
         function solve() { return "placeholder"; }
       `;
       // we skip real evaluation of others, just testing Q1 for now to see if executeCode handles it
       continue;
    }

    const res = await executeCode(userCode, 'javascript', undefined, undefined, '', problem.testCases);
    console.log(`Passed: ${res.passed}`);
    if (!res.passed) {
      failed++;
      console.log(`Failed Results:`, JSON.stringify(res.results, null, 2));
      if (res.error) console.log(`Error:`, res.error);
    }
  }

  if (failed === 0) {
    console.log("\n✅ All tested execution flows worked.");
  } else {
    console.log(`\n❌ ${failed} execution flows failed.`);
  }
}

runTests().catch(console.error);
