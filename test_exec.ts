import { executeCode } from './src/utils/codeExecutor.ts';

async function test() {
  const userCode = `
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

  const testCases = [
    { input: "buildTree([1]), 1", expected: "-1" },
    { input: "buildTree([1, 2]), 1", expected: "-1" },
    { input: "buildTree([1, 2]), 2", expected: "1" }
  ];

  const res = await executeCode(userCode, 'javascript', console.log, undefined, '', testCases);
  console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
