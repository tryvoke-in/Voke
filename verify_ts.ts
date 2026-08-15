import { executeCode } from './src/utils/codeExecutor.ts';
import { NEWTON_SECTION_A_PROBLEMS } from './src/data/eliteNewtonQuestions.ts';

async function runTests() {
  const problem = NEWTON_SECTION_A_PROBLEMS.find(p => p.id === 'newton_q1');
  
  const userCode = `
function solve(root: any, X: any): any {
  if (!root) return -1;
  let parent: number = -1;
  const queue: { node: any, p: number }[] = [{ node: root, p: -1 }];
  while (queue.length > 0) {
    const { node, p } = queue.shift() as { node: any, p: number };
    if (node.val === X) return p;
    if (node.left) queue.push({ node: node.left, p: node.val });
    if (node.right) queue.push({ node: node.right, p: node.val });
  }
  return -1;
}
  `;

  console.log("Evaluating with stripTypeScript...");
  const res = await executeCode(userCode, 'typescript', undefined, undefined, '', problem.testCases);
  console.log(`Passed: ${res.passed}`);
  if (!res.passed) {
    console.log(`Failed Results:`, JSON.stringify(res.results, null, 2));
    if (res.error) console.log(`Error:`, res.error);
  }
}

runTests().catch(console.error);
