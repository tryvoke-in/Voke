// Auto-generated 20 Debugging Questions from Newton School
import { DebugProblem } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_DEBUG_PROBLEMS: DebugProblem[] = [
  {
    "id": "debug_q1",
    "title": "Target Sum In BT - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Target Sum In BT - Debug 1\r\nMedium\r\nxp icon\r\n0/40\r\nTime Limit: 10, Memory Limit: 256000\r\nGiven the root of a binary tree and an integer targetSum, return True if there exists a path starting from the root and ending at a leaf node such that the sum of all node values along the path is equal to targetSum.\r\n\r\nA leaf node is a node that has no children.\r\n\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function has_path_sum(), which takes the root node and targetSum as its parameters.\r\n\r\nInput Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n   \r\nThe next line contains an integer targetSum.\r\n \r\nA value of -1 represents a null node.\r\nOnce a node is ",
    "buggyCode": "function hasPathSum(root, targetSum) {\n  if (root === null) return false;\n  if (root.val === targetSum) return true;\n  return hasPathSum(root.left, targetSum - root.val) || hasPathSum(root.right, targetSum - root.val);\n}",
    "scenario": "The code fails when it encounters a tree with a node that has a value equal to the target sum, but the node has children. In this case, the function will incorrectly return true.",
    "expectedBehavior": "It should return false when the node with the target sum has children, because the target sum should be equal to the sum of the node's value and its children's values, not just the node's value."
  },
  {
    "id": "debug_q3",
    "title": "Root to Node Path Sum - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Root to Node Path Sum - Debug 1\r\nMedium\r\nxp icon\r\n0/40\r\nTime Limit: 10, Memory Limit: 256000\r\nYou are given the root of a binary tree and an integer targetSum.\r\n\r\nReturn True if there exists a path starting from the root and ending at any node in the tree such that the sum of all node values along the path is equal to targetSum.\r\n\r\nA path must follow parent-to-child connections and always move downward.\r\n\r\nNote:\r\n\r\nThe path can end at any node.\r\nThe path must always start from the root.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function has_path_sum(), which takes the root node and targetSum as its parameters.\r\n\r\nInput Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level o",
    "buggyCode": "function hasPathSum(root, targetSum) {\n  if (root === null) return false;\n  if (root.val === targetSum) return true;\n  return hasPathSum(root.left, targetSum - root.val) || hasPathSum(root.right, targetSum - root.val);\n}",
    "scenario": "The code fails when it encounters a tree with a node that has a value equal to the target sum, but the path does not end at that node. It incorrectly returns true because it only checks if the current node's value equals the target sum, not if the path ends at that node.",
    "expectedBehavior": "It should return false when the path does not end at the node with a value equal to the target sum, and return true when there exists a path from the root to any node with a sum equal to the target sum."
  },
  {
    "id": "debug_q4",
    "title": "Path from root to X - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Path from root to X - Debug 1\r\nMedium\r\nxp icon\r\n0/40\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the root of a binary tree and an integer X. Your task is to find the path from the root node to the node with value X. The path should include both the root and the target node, in order.\r\nNote:\r\nAll node values in the binary tree are unique.\r\nIf the node with value X does not exist, return an empty list.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\nComplete the function: path_from_root(root, X).\r\nThe function must return a list containing the path from the root to the node with value X.\r\n\r\nInput Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n   \r\nThe next line con",
    "buggyCode": "function solve(root, X) {\n  let path = []; \n  function dfs(node, path) {\n    if (!node) return; \n    if (node.val === X) {\n      path.push(node.val);\n      return path;\n    }\n    path.push(node.val);\n    dfs(node.left, path);\n    dfs(node.right, path);\n  }\n  dfs(root, path);\n  return path;\n}",
    "scenario": "The code fails when it encounters a node with multiple children. It will return a path with the root node and all its children, but not the correct path to the target node.",
    "expectedBehavior": "It should return the correct path from the root node to the node with value X, or an empty list if the target node does not exist."
  },
  {
    "id": "debug_q5",
    "title": "Find Parent of the given Node - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Find Parent of the given Node - Debug 1\r\nEasy\r\nxp icon\r\n0/20\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the root node of a binary tree and an integer X.\r\n\r\nYour task is to find and return the value of the parent node of the node whose value is X.\r\n\r\nNotes\r\nAll nodes in the binary tree have unique values.\r\n\r\nIf the node with value X is the root node, return -1.\r\n\r\nIf the node with value X does not exist in the tree, return -1.\r\n\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\nComplete the function: find_parent(root, X).\r\nThe function receives the root of a binary tree and an integer X, and must return the value of the parent of the node with value X.\r\nIf X is the root node or does not exist in the tree, return -1.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-nul",
    "buggyCode": "function findParent(root, X) {\n  if (root === null) return -1;\n  if (root.val === X) return -1;\n  if (root.left !== null && root.left.val === X) return root.val;\n  if (root.right !== null && root.right.val === X) return root.val;\n  return findParent(root.left, X) || findParent(root.right, X);\n}",
    "scenario": "The code fails when it tries to find the parent of a node that is not present in the left or right subtree of the current node. In this case, the function will return the value of the current node, which is incorrect.",
    "expectedBehavior": "It should return -1 when the node with value X is not present in the tree, and the value of the parent node when X is present in the tree."
  },
  {
    "id": "debug_q7",
    "title": "Invert given Binary Tree - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Invert given Binary Tree - Debug 1\r\nEasy\r\nxp icon\r\n0/20\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the root of a binary tree. Your task is to invert the tree and return its root.\r\n\r\nInverting a binary tree means swapping the left and right children of every node, producing the mirror image of the original tree.\r\n\r\nExample:\r\n\r\nIf a node has a left child L and a right child R, then after inversion, the node will have R as its left child and L as its right child.\r\n\r\nInput\r\nUser Task\r\n\r\nSince this is a functional problem, you do not need to handle input or output.\r\nYou only need to complete the function invert_tree(root).\r\n\r\nThe function receives the root node of a binary tree and must return the root node of the inverted binary tree.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\nFor each test case:\r\n\r\nThe first line contains an integer N, representing the number of non-null nodes in the tree.\r\n \r\nThe next line contai",
    "buggyCode": "function invertTree(root) {\n  if (root === null) return null;\n  if (root.left === null && root.right === null) return root;\n  let temp = root.left;\n  root.left = root.right;\n  root.right = temp;\n  return root;\n}",
    "scenario": "The code fails when it encounters a tree with a node having a left child with a left child of its own. In this case, the inversion operation is performed only once, resulting in the left child of the original left child being lost.",
    "expectedBehavior": "It should recursively invert the left and right subtrees of each node, ensuring that all nodes are properly inverted and their children are correctly swapped."
  },
  {
    "id": "debug_q8",
    "title": "Check Subtree - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Check Subtree - Debug 1\r\nMedium\r\nxp icon\r\n0/40\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the roots of two binary trees, root and subRoot.\r\n\r\nYour task is to determine whether subRoot appears as a subtree of root.\r\n\r\nA subtree is formed by choosing any node in the main tree and considering that node along with all of its descendants.\r\n\r\nThe structure of the subtree and the values of all corresponding nodes must exactly match subRoot.\r\n\r\nNote:\r\n\r\nThe entire tree root itself can also be considered a subtree.\r\n\r\nThe match must be structural (same shape) and value-wise.\r\n\r\nReturn True if such a subtree exists; otherwise, return False.\r\n\r\nInput\r\nUser Task\r\n\r\nSince this is a functional problem, you do not need to handle input or output.\r\nYou only need to complete the function check_subtree(root, subRoot).\r\nCustom Input Format\r\n\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n\r\nFor each test case:\r\n\r\nThe first line contains an integer N, the num",
    "buggyCode": "function checkSubtree(root, subRoot) {\n  if (!root) return false;\n  if (JSON.stringify(root) === JSON.stringify(subRoot)) return true;\n  return checkSubtree(root.left, subRoot) || checkSubtree(root.right, subRoot);\n}",
    "scenario": "The code fails when it encounters a binary tree with duplicate nodes, because it uses JSON.stringify() to compare nodes which returns the same string for different objects with the same properties.",
    "expectedBehavior": "It should correctly identify the subtree by comparing the structure and values of the nodes, even when there are duplicate nodes in the tree."
  },
  {
    "id": "debug_q9",
    "title": "Is Height Balanced Binary Tree? - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Is Height Balanced Binary Tree? - Debug 1\r\nMedium\r\nxp icon\r\n0/40\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root node of a binary tree, your task is to determine if it is height balanced.\r\n\r\nNote: A binary tree is called height balanced if the depth of the two subtrees of every node never differs by more than one.\r\nClick to enlarge\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function is_height_balanced(), which takes the root node as its parameter.\r\n\r\nCustom Input\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n   \r\nA value of -1 represents a null node. Once a node is marked as -1, no further information about its children is provided.\r\n \r\nOu",
    "buggyCode": "function isHeightBalanced(root) {\n  if (!root) return true;\n  return Math.abs(getHeight(root.left) - getHeight(root.right)) <= 1 && isHeightBalanced(root.left) && isHeightBalanced(root.right);\n}\n\nfunction getHeight(node) {\n  if (!node) return 0;\n  return Math.max(getHeight(node.left), getHeight(node.right)) + 1;\n}",
    "scenario": "The code fails when it encounters a tree with a large number of nodes, causing a stack overflow due to excessive recursive calls.",
    "expectedBehavior": "It should return true if the tree is height balanced, and false otherwise, without causing a stack overflow."
  },
  {
    "id": "debug_q10",
    "title": "Postorder Traversal of BT - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Postorder Traversal of BT - Debug 1\r\nEasy\r\nxp icon\r\n0/20\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the root of a binary tree containing N nodes. Your task is to return the postorder traversal of the given binary tree.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. Complete the function: postorder_traversal(root).\r\nThe function receives the root of a binary tree and must return its postorder traversal.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of binary trees. For each test case:\r\n\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\nA value of -1 represents a null node.\r\nNote: Once a node is marked as -1, no further information about its children is provided.\r\nOutput\r\nReturn the postorder traversal of the binary tree as a list of no",
    "buggyCode": "function postorder_traversal(root) {\n  if (root === null) return []; // base case\n  return [root.val].concat(postorder_traversal(root.left)).concat(postorder_traversal(root.right));\n}",
    "scenario": "The code fails when trying to traverse a tree with a large number of nodes. It will cause a stack overflow error because it doesn't use a more efficient approach to traverse the tree.",
    "expectedBehavior": "It should use a more efficient approach such as Morris Traversal or Iterative Postorder Traversal to avoid the stack overflow error and correctly return the postorder traversal of the binary tree."
  },
  {
    "id": "debug_q11",
    "title": "Sum of Nodes in a BT - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Sum of Nodes in a BT - Debug 1\r\nEasy\r\nxp icon\r\n0/20\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root of a binary tree, your task is to find the sum of values of all nodes present in the binary tree without using any extra space.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\nComplete the function: sum_nodes(root)\r\nThe function receives the root of a binary tree and must return the sum of values of all the nodes.\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n \r\nA value of -1 represents a null node.\r\nNote: Once a node is marked as -1, no further information about its children is provided.\r\nOutput\r\nReturn an integer representing the sum of all the nodes.",
    "buggyCode": "function sum_nodes(root) {\n  if (root === null) return 0;\n  return root.val + sum_nodes(root.left) + sum_nodes(root.right);\n}",
    "scenario": "The code fails when it encounters a tree with a large number of nodes, causing a stack overflow error due to excessive recursion.",
    "expectedBehavior": "It should handle large trees by using an iterative approach, such as a queue or a stack, to avoid excessive recursion."
  },
  {
    "id": "debug_q12",
    "title": "Maximum Value in BT (No Extra Space) - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Maximum Value in BT (No Extra Space)\r\nEasy\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root node of a binary tree, your task is to find the maximum node value without using any extra space.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\n\r\nComplete the function: max_node(root).\r\n\r\nThe function receives the root of a binary tree and must return the maximum node value in the tree.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n \r\n\r\nA value of -1 represents a null node.\r\nNote: Once a node is marked as -1, no further information about its children is provided.\r\n\r\nOutput\r\nReturn an integer representing the maximum node value in the given binary tree.\r\nConstraints\r",
    "buggyCode": "function max_node(root) {\n  if (root === null) return 0;\n  let max = root.val;\n  let queue = [root];\n  while (queue.length > 0) {\n    let node = queue.shift();\n    if (node.left !== null) {\n      max = Math.max(max, node.left.val);\n      queue.push(node.left);\n    }\n    if (node.right !== null) {\n      max = Math.max(max, node.right.val);\n      queue.push(node.right);\n    }\n  }\n  return max;\n}",
    "scenario": "The code fails when it encounters a binary tree with an odd number of levels, where the last level has only one node. In this case, the code will not correctly identify the maximum node value.",
    "expectedBehavior": "It should correctly identify the maximum node value in the binary tree, regardless of the number of levels or the number of nodes in the last level."
  },
  {
    "id": "debug_q13",
    "title": "Count Nodes in Binary Tree (No Extra Space) - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Count Nodes in Binary Tree (No Extra Space)\r\nEasy\r\n2x\r\nxp icon\r\n20/20\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root of a binary tree, return the total number of nodes present in the tree without using any extra space.\r\n\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\n\r\nComplete the function: node_count(root).\r\n\r\nThe function receives the root of a binary tree and must return the total number of nodes in the tree.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n \r\nA value of -1 represents a null node.\r\nNote: Once a node is marked as -1, no further information about its children is provided.\r\n\r\nOutput\r\nReturn an integer representing the total number of n",
    "buggyCode": "function node_count(root) {\n  let count = 0;\n  if (root === null) return 0;\n  count += 1;\n  if (root.left !== null) count += node_count(root.left);\n  if (root.right !== null) count += node_count(root.right);\n  return count;\n}",
    "scenario": "The code fails when it encounters a tree with a large number of nodes, causing a stack overflow due to excessive recursion.",
    "expectedBehavior": "It should return the total number of nodes in the tree without using any extra space, handling large trees by using a more efficient approach such as Morris traversal or iterative DFS."
  },
  {
    "id": "debug_q14",
    "title": "Count Nodes with One Child (Postorder Based) - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Count Nodes with One Child (Postorder Based)\r\nEasy\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root node of a binary tree, your task is to find the number of nodes that have exactly one child without using any extra space.\r\n\r\nNote:\r\n\r\nSolve the problem using a postorder approach, where the result for a node is determined after obtaining results from its left and right subtrees.\r\n\r\nInput\r\nUser Task\r\n\r\nSince this is a functional problem, you do not need to handle input or output.\r\nComplete the function: one_child(root).\r\n\r\nThe function receives the root of a binary tree and must return number of nodes with exactly one child.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n   \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n \r\n\r\nA value of -1 represents a ",
    "buggyCode": "function one_child(root) {\n  if (root === null) return 0;\n  let count = 0;\n  if (root.left !== null && root.right !== null) {\n    count += one_child(root.left) + one_child(root.right);\n  } else if (root.left !== null || root.right !== null) {\n    count += 1;\n  }\n  return count;\n}",
    "scenario": "The code fails when it encounters a tree with a node having two children. It incorrectly counts the node with two children as a node with one child.",
    "expectedBehavior": "It should correctly count only the nodes with exactly one child, ignoring nodes with two children."
  },
  {
    "id": "debug_q15",
    "title": "Searching in Binary Tree (No Extra Space) - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Searching in Binary Tree (No Extra Space)\r\nEasy\r\n2x\r\nxp icon\r\n20/20\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given the root of a binary tree where each node stores an integer value.\r\nYou are also given an integer key.\r\nYour task is to determine whether any node in the binary tree has a value equal to key, without using any extra space.\r\nReturn 1 if there exists at least one node whose value is equal to key, otherwise, return 0.\r\n\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output.\r\nComplete the function: search(root, key).\r\nThe function receives the root of a binary tree and an integer key.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n \r\nFor each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes in the tree.\r\n   \r\nThe next line contains space-separated integers representing the level-order traversal of the binary tree.\r",
    "buggyCode": "function search(root, key) {\n  if (root === null) return 0;\n  if (root.val === key) return 1;\n  if (root.left !== null) {\n    if (root.left.val === key) return 1;\n    return search(root.left, key);\n  }\n  if (root.right !== null) {\n    if (root.right.val === key) return 1;\n    return search(root.right, key);\n  }\n  return 0;\n}",
    "scenario": "The code fails when searching for a key in a binary tree with a large number of nodes. It will cause a stack overflow error due to the recursive calls.",
    "expectedBehavior": "It should return 1 if there exists at least one node whose value is equal to key, otherwise, return 0, without using any extra space."
  },
  {
    "id": "debug_q16",
    "title": "Maximum Depth of BT - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Maximum Depth of BT - Debug 3\r\nMedium\r\nTime Limit: 2, Memory Limit: 128000\r\nGiven the root of a binary tree having N nodes, your task is to find its maximum depth.\r\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\r\n\r\nNote: Depth of empty tree is considered 0.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. Complete the function: max_depth(root).\r\nThe function receives the root of a binary tree and must return the maximum depth of the tree.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of binary trees. For each test case:\r\n \r\nThe first line contains a positive integer N, representing the number of non-null nodes.\r\n \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\nA value of -1 represents a null node.\r\nNote: Once a node is marked as -1, no further information ab",
    "buggyCode": "function maxDepth(root) {\n  if (root === null) return 0;\n  return 1 + maxDepth(root.left) + maxDepth(root.right);\n}",
    "scenario": "The code fails when it encounters a tree with only one node. It returns 2 instead of 1.",
    "expectedBehavior": "It should return 1 for a tree with only one node."
  },
  {
    "id": "debug_q17",
    "title": "Identical Binary Trees - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Identical Binary Trees - Debug 1\r\nEasy\r\nTime Limit: 2, Memory Limit: 256000\r\nYou are given two binary trees. Your task is to determine whether the two trees are identical.\r\n\r\nTwo binary trees are considered identical if:\r\n\r\nThey have the same structure.\r\nCorresponding nodes have the same values.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. You only need to complete the function isSameTree(root1, root2).\r\nThe function receives the root nodes of two binary trees.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\nFor each test case:\r\n\r\n \r\nThe first line contains an integer N, the number of non-null nodes in the first tree.\r\n \r\nThe next line contains space-separated integers representing the level order traversal of the first tree.\r\n \r\nThe next line contains an integer M, the number of non-null nodes in the second tree.\r\n \r\nThe next line contains space-separated integers represe",
    "buggyCode": "function isSameTree(root1, root2) {\n  if (root1 === null && root2 === null) return true;\n  if (root1 === null || root2 === null) return false;\n  if (root1.val === root2.val) {\n    return isSameTree(root1.left, root2.left) && isSameTree(root1.right, root2.right);\n  }\n  return false;\n}",
    "scenario": "The code fails when it encounters two trees with different values at the root node, but the rest of the tree is identical.",
    "expectedBehavior": "It should return true, indicating that the two trees are identical, because they have the same structure and corresponding nodes have the same values."
  },
  {
    "id": "debug_q18",
    "title": "Univalued BT - Debug 1",
    "difficulty": "Easy",
    "topic": "Binary Tree",
    "description": "Univalued BT - Debug 1\r\nEasy\r\nxp icon\r\n0/20\r\nTime Limit: 2, Memory Limit: 256000\r\nGiven the root node of the binary tree, your task is to find whether the tree is uni-valued.\r\n\r\nNote: A binary tree is uni-valued if every node in the tree has the same value.\r\n\r\nInput\r\nUser Task\r\n\r\nSince this is a functional problem, you do not need to handle input or output.\r\nYou only need to complete the function is_unival_tree(root).\r\nThe function receives the root node of the given binary tree.\r\n\r\nCustom Input Format\r\n\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n\r\nFor each test case:\r\n\r\nThe first line contains an integer N, representing the number of non-null nodes in the tree.\r\n \r\nThe next line contains space-separated integers representing the level order traversal of the tree.\r\n \r\nA value of -1 represents a null node.\r\nOnce a node is marked as -1, no further information about its children is provided.\r\n \r\nOutput\r\nReturn True if the given tree is uni-value",
    "buggyCode": "function isUnivalTree(root) {\n  if (root === null) return true;\n  let val = root.val;\n  let queue = [root];\n  while (queue.length > 0) {\n    let node = queue.shift();\n    if (node.left !== null && node.left.val !== val) return false;\n    if (node.right !== null && node.right.val !== val) return false;\n    if (node.left !== null) queue.push(node.left);\n    if (node.right !== null) queue.push(node.right);\n  }\n  return true;\n}",
    "scenario": "The code fails when the tree has a node with a child that has a different value, but the child is not null, and the parent's value is not the same as the child's value.",
    "expectedBehavior": "It should return false when the tree is not uni-valued, even if the child is not null but has a different value than the parent."
  },
  {
    "id": "debug_q19",
    "title": "Mirror Binary Trees - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Mirror Binary Trees - Debug 1\r\nMedium\r\nTime Limit: 10, Memory Limit: 128000\r\nYou are given two binary trees. Your task is to check whether the two trees are mirror images of each other.\r\nTwo binary trees are said to be mirror images if the structure of one tree is the mirror reflection of the other tree.\r\nMore formally:\r\n\r\nThe root nodes of both trees must have the same value.\r\nThe left subtree of the first tree must be a mirror of the right subtree of the second tree.\r\nThe right subtree of the first tree must be a mirror of the left subtree of the second tree.\r\nInput\r\nUser Task\r\nSince this is a functional problem, you do not need to handle input or output. You only need to complete the function isMirror(root1, root2). The function receives the root nodes of two binary trees.\r\n\r\nCustom Input Format\r\nThe first line contains a positive integer T, representing the number of test cases.\r\n\r\nFor each test case:\r\n\r\n \r\nThe first line contains an integer N, the number of non-null nodes in the f",
    "buggyCode": "function isMirror(root1, root2) {\n  if (root1 === null && root2 === null) return true;\n  if (root1 === null || root2 === null) return false;\n  if (root1.val !== root2.val) return false;\n  return isMirror(root1.left, root2.right);\n}",
    "scenario": "The code fails when it encounters two trees with different values at the root nodes, but the rest of the trees are mirror images of each other.",
    "expectedBehavior": "It should return true because the trees are mirror images of each other, even though the root nodes have different values."
  },
  {
    "id": "debug_q20",
    "title": "Merge Binary Trees - Debug 1",
    "difficulty": "Medium",
    "topic": "Binary Tree",
    "description": "Not captured from the opened question view.",
    "buggyCode": "function mergeTrees(root1, root2) {\n  if (root1 === null) return root2;\n  if (root2 === null) return root1;\n  if (root1.val === root2.val) {\n    root1.left = mergeTrees(root1.left, root2.left);\n    root1.right = mergeTrees(root1.right, root2.right);\n  } else {\n    root1.val += root2.val;\n  }\n  return root1;\n}",
    "scenario": "The code fails when two trees have different node values at the same position, but the second tree has a node with a value greater than the first tree's node value. In this case, the code incorrectly adds the values of the nodes instead of replacing the first tree's node with the second tree's node.",
    "expectedBehavior": "It should replace the first tree's node with the second tree's node when their values are different, and recursively merge the left and right subtrees."
  }
];
