// Auto-generated from Newton School excel with DEEP AI Test Cases
import { ProblemDefinition } from '@/components/elite/EliteCodingAssessment';

export const NEWTON_SECTION_A_PROBLEMS: any[] = [
  {
    "id": "newton_q1",
    "title": "1. Find Parent of the given Node",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Find Parent of the given Node\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nYou are given the root node of a binary tree and an integer X.\n\nYour task is to find and return the value of the parent node of the node whose value is X.\n\nNotes\nAll nodes in the binary tree have unique values.\n\nIf the node with value X is the root node, return -1.\n\nIf the node with value X does not exist in the tree, return -1.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: find_parent(root, X).\nThe function receives the root of a binary tree and an integer X, and must return the value of the parent of the node with value X.\nIf X is the root node or does not exist in the tree, return -1.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n   \nThe next line contains an integer X.\n \nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\nOutput\nReturn a single integer representing the value of the parent of the node with value X.\nIf X is the root node or does not exist in the tree, return -1.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n5\n∗\n1\n0\n3\n1≤N≤5∗10 \n3\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n,\nX\n≤\n1\n0\n6\n0≤Node.val,X≤10 \n6\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n4\nOutput\n2\nExplanation\nThe following image depicts the given binary tree:\nClick to enlarge\n\nNode with value 2 is the parent node of the node with value 4, thus the answer is 2.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2]), 1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3]), 1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3]), 3",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3]), 4",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 3",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 4",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 5",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 6",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 3",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 4",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 5",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 6",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 7",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 8",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 0",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), -1",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 7.5",
        "expected": "-1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 'a'",
        "expected": "-1"
      }
    ]
  },
  {
    "id": "newton_q2",
    "title": "2. Path from root to X",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Path from root to X\nMedium\nxp icon\n20/40\nTime Limit: 2, Memory Limit: 256000\nYou are given the root of a binary tree and an integer X. Your task is to find the path from the root node to the node with value X. The path should include both the root and the target node, in order.\nNote:\nAll node values in the binary tree are unique.\nIf the node with value X does not exist, return an empty list.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: path_from_root(root, X).\nThe function must return a list containing the path from the root to the node with value X.\n\nInput Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n   \nThe next line contains an integer X.\n   \nA value of -1 represents a null node. Once a node is marked as -1, no further information about its children is provided..\n \nOutput\nReturn a list of integers representing the path from the root to node X.\nIf X does not exist, return an empty list.\n\nNote\nIf the returned list is empty, Judge will print -1.\nConstraints\n1 ≤ T ≤ 10\n \n1 ≤ N ≤ 1000\n \nAll node values are unique\n \n1 ≤ Node.val, X ≤ 106\nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n8\n\nOutput\n1 3 5 8\n\nExplanation\nClick to enlarge\n\nStarting from the root node 1, the path to node 8 is 1 → 3 → 5 → 8. Hence, the output is 1 3 5 8.\n\nInput\n2\n5\n5 3 8 -1 4 -1 10\n5\n3\n7 -1 9 1\n10\n\nOutput\n5\n-1\n\nExplanation\nIn the first binary tree, node 5 is the root itself, so the path is 5.\nIn the second binary tree, node 10 does not exist, so the output is -1.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, null, null]), 2",
        "expected": "[1, 2]"
      },
      {
        "input": "buildTree([1, 2, null, null]), 1",
        "expected": "[1]"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, null]), 3",
        "expected": "[1, 2, 3]"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, null]), 4",
        "expected": "[]"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, null]), 1",
        "expected": "[1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, null, null, null, null]), 4",
        "expected": "[1, 2, 3, 4]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, null, null, null, null]), 5",
        "expected": "[1, 2, 3, 4, 5]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, null, null, null, null]), 6",
        "expected": "[1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, null, null, null, null]), 7",
        "expected": "[1, 2, 3, 4, 5, 6, 7]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, null, null, null, null, null, null, null]), 8",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, null, null, null, null, null, null, null]), 9",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null, null, null, null, null, null, null]), 10",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, null, null, null, null, null, null, null, null]), 11",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null, null, null, null, null, null, null, null]), 12",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, null, null, null, null, null, null, null, null, null]), 13",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null, null, null, null, null, null, null, null, null, null]), 14",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null, null, null, null, null, null, null, null, null, null, null]), 15",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, null, null, null, null, null, null, null, null, null, null, null]), 16",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, null, null, null, null, null, null, null, null, null, null, null, null]), 17",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 18",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 19",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]"
      }
    ]
  },
  {
    "id": "newton_q3",
    "title": "3. Root to Node Path Sum",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Root to Node Path Sum\nMedium\nTime Limit: 10, Memory Limit: 256000\nYou are given the root of a binary tree and an integer targetSum.\n\nReturn True if there exists a path starting from the root and ending at any node in the tree such that the sum of all node values along the path is equal to targetSum.\n\nA path must follow parent-to-child connections and always move downward.\n\nNote:\n\nThe path can end at any node.\nThe path must always start from the root.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function has_path_sum(), which takes the root node and targetSum as its parameters.\n\nInput Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n   \nThe next line contains an integer targetSum.\n \nA value of -1 represents a null node.\nOnce a node is marked as -1, no further information about its children is provided.\nOutput\nReturn the boolean value True if there exists a path starting from the root and ending at any node such that the sum of the node values equals the given target; otherwise, return False.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10  \n1\n≤\nN\n≤\n5000\n1≤N≤5000  \n0\n≤\nNode.val\n≤\n1000\n0≤Node.val≤1000  \n0\n≤\ntargetSum\n≤\n10000\n0≤targetSum≤10000\nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n4\nOutput\nTrue\nExplanation\nThe above given input describes the following binary tree:\nClick to enlarge\n\nThe path 1 → 3 from the root to leaf has a sum of 4.\n\nInput\n2\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n6\n3\n1 2 3\n3\nOutput\nFalse\nTrue\nExplanation\nThe first input describes the following binary tree:\nClick to enlarge",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q4",
    "title": "4. Lowest Common Ancestor in a BT",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Lowest Common Ancestor in a BT\nMedium\nxp icon\n20/40\nTime Limit: 2, Memory Limit: 256000\nYou are given the root of a binary tree and two nodes p and q representing the two nodes present in the tree. Your task is to find and return the Lowest Common Ancestor (LCA) of nodes p and q.\n\nThe lowest common ancestor is defined between two nodes p and q as the lowest node in the tree that has both p and q as descendants (where we allow a node to be a descendant of itself).\nNote: The nodes p, q, and the LCA are all of type Node, where each node has attributes val, left, and right.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: lowest_common_ancestor(root, p, q) where parameters p and q are nodes present in the binary tree, and the function must return the node representing their Lowest Common Ancestor (LCA).\nInput Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n   \nThe next line contains two integers denoting the values of p and q.\n \nA value of -1 represents a null node.\nOnce a node is marked as -1, no further information about its children is provided.\nOutput\nReturn a node representing the Lowest Common Ancestor of the given nodes.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n2\n≤\nN\n≤\n1\n0\n3\n2≤N≤10 \n3\n \n−\n1\n0\n5\n≤\nNode.val\n≤\n1\n0\n5\n−10 \n5\n ≤Node.val≤10 \n5\n \nNode.val values are unique\nNode.val values are unique\np\n≠\nq\np\n\n=q\np\n and \nq\n exist in the tree\np and q exist in the tree\nExample\nInput\n1\n5\n3 9 20 -1 -1 15 7\n15 7\nOutput\n20\nExplanation\nThe above given input parameters represents the following binary tree:\nClick to enlarge\n\nAnd the nodes marked in blue are the two given nodes. Since both 15 and 7 are descendants of node 20, node 20 serves as their Lowest Common Ance",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q5",
    "title": "5. Target Sum In BT",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Target Sum In BT\nMedium\nTime Limit: 10, Memory Limit: 256000\nGiven the root of a binary tree and an integer targetSum, return True if there exists a path starting from the root and ending at a leaf node such that the sum of all node values along the path is equal to targetSum.\n\nA leaf node is a node that has no children.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function has_path_sum(), which takes the root node and targetSum as its parameters.\n\nInput Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n   \nThe next line contains an integer targetSum.\n \nA value of -1 represents a null node.\nOnce a node is marked as -1, no further information about its children is provided.\nOutput\nReturn the boolean value True if there exists a root-to-leaf path such that the sum of the node values equals the given target; otherwise, return False.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10  \n1\n≤\nN\n≤\n5000\n1≤N≤5000  \n0\n≤\nNode.val\n≤\n1000\n0≤Node.val≤1000  \n0\n≤\ntargetSum\n≤\n10000\n0≤targetSum≤10000\nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n10\nOutput\nTrue\nExplanation\nThe above given input describes the following binary tree:\nClick to enlarge\n\nThe path 1 → 3 → 6 from the root to leaf has a sum of 10.\n\nInput\n2\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n19\n3\n1 2 3\n4\nOutput\nFalse\nTrue\nExplanation\nThe first input describes the following binary tree:\nClick to enlarge",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, null]), 3",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3]), 6",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3]), 7",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3]), 5",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3]), 3",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 6",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 7",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 5",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 4",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 3",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 6",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 7",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 5",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 4",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 3",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 15",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 16",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 14",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 13",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 12",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 11",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 10",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 9",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 8",
        "expected": "false"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 7",
        "expected": "true"
      }
    ]
  },
  {
    "id": "newton_q6",
    "title": "6. Count Nodes in Binary Tree (No Extra Space)",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Count Nodes in Binary Tree (No Extra Space)\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nGiven the root of a binary tree, return the total number of nodes present in the tree without using any extra space.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\n\nComplete the function: node_count(root).\n\nThe function receives the root of a binary tree and must return the total number of nodes in the tree.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n \nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn an integer representing the total number of nodes in the given binary tree.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n\nOutput\n9\n\nExplanation\nThe binary tree described by the given level order traversal contains 9 non-null nodes.\n\nClick to enlarge\n\nInput\n2\n4\n1 2 3 -1 4\n2\n10 -1 20\n\nOutput\n4\n2\n\nExplanation\nThe first binary tree contains 4 non-null nodes, so the output is 4.\n\nThe second binary tree contains 2 non-null nodes, so the output is 2.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2]), 2",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, null]), 2",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4]), 4",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, 4, null, null, 5]), 5",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, null, null, 7]), 7",
        "expected": "7"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8]), 8",
        "expected": "8"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, null, null, 9]), 9",
        "expected": "9"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, null, null, 10]), 10",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null, 11]), 11",
        "expected": "11"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, null, null, 12]), 12",
        "expected": "12"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null, null, 13]), 13",
        "expected": "13"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, null, null, 14]), 14",
        "expected": "14"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null, null, 15]), 15",
        "expected": "15"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null, null, 16]), 16",
        "expected": "16"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, null, 17]), 17",
        "expected": "17"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, null, 18]), 18",
        "expected": "18"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, null, 19]), 19",
        "expected": "19"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, null, null, 20]), 20",
        "expected": "20"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, null, null, 21]), 21",
        "expected": "21"
      }
    ]
  },
  {
    "id": "newton_q7",
    "title": "7. Searching in Binary Tree (No Extra Space)",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Searching in Binary Tree (No Extra Space)\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nYou are given the root of a binary tree where each node stores an integer value.\nYou are also given an integer key.\nYour task is to determine whether any node in the binary tree has a value equal to key, without using any extra space.\nReturn 1 if there exists at least one node whose value is equal to key, otherwise, return 0.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: search(root, key).\nThe function receives the root of a binary tree and an integer key.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes in the tree.\n   \nThe next line contains space-separated integers representing the level-order traversal of the binary tree.\n   \nThe next line contains an integer key, the value to be searched in the tree.\n \n\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn 1 if the key exists in the given binary tree, else return 0.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n \n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n \n0\n≤\nNode.val\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \n \n0\n≤\nk\ne\ny\n≤\n1\n0\n4\n0≤key≤10 \n4\n \nExample\nInput\n1\n9\n50 25 75 12 30 60 85 -1 -1 52 70\n60\nOutput\n1\nExplanation\nThe following image depicts the Binary Tree and Key is present in it.\nClick to enlarge\n\nInput\n2\n5\n10 5 20 -1 -1 15 25\n15\n5\n50 30 70 -1 -1 60 80\n100\n\nOutput\n1\n0\n\nExplanation\nTest Case 1:\nThe binary tree contains the value 15 as one of its nodes.\nHence, the function returns 1.\n\nTest Case 2:\nThe binary tree does not contain the value 100 in any node.\nHence, the function returns 0.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q8",
    "title": "8. Count Nodes with One Child (Postorder Based)",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Count Nodes with One Child (Postorder Based)\nEasy\nTime Limit: 2, Memory Limit: 256000\nGiven the root node of a binary tree, your task is to find the number of nodes that have exactly one child without using any extra space.\n\nNote:\n\nSolve the problem using a postorder approach, where the result for a node is determined after obtaining results from its left and right subtrees.\n\nInput\nUser Task\n\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: one_child(root).\n\nThe function receives the root of a binary tree and must return number of nodes with exactly one child.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n \n\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn an integer representing the number of nodes with exactly one child.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n\nOutput\n2\n\nExplanation\n\nThe following image depicts the given binary tree.\n\nClick to enlarge\n\nNodes 2 and 4 have exactly one child each, therefore the answer is 2.\n\nInput\n2\n4\n10 6 -1 4 8\n3\n1 -1 3 2 -1 \n\nOutput\n1\n2\n\nExplanation\n\nIn the first binary tree, only node 10 has exactly one child, so the output is 1.\n\nIn the second binary tree, nodes 1 and 3 have exactly one child, so the output is 2.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, null]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null]), 0",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3]), 0",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, null]), 0",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, 3, 4, null, null, null, null]), 0",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, null, null, null, null]), 0",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, null, null, null, null]), 0",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, null, null, null, null, null]), 0",
        "expected": "7"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, null, null, null, null, null, null, null, null]), 0",
        "expected": "8"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, null, null, null, null, null, null, null, null]), 0",
        "expected": "9"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null, null, null, null, null, null, null]), 0",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, null, null, null, null, null, null, null, null]), 0",
        "expected": "11"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null, null, null, null, null, null, null, null]), 0",
        "expected": "12"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, null, null, null, null, null, null, null, null]), 0",
        "expected": "13"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null, null, null, null, null, null, null, null]), 0",
        "expected": "14"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null, null, null, null, null, null, null, null]), 0",
        "expected": "15"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, null, null, null, null, null, null, null]), 0",
        "expected": "16"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, null, null, null, null, null, null, null]), 0",
        "expected": "17"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, null, null, null, null, null, null, null]), 0",
        "expected": "18"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, null, null, null, null, null, null, null, null]), 0",
        "expected": "19"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, null, null, null, null, null, null, null, null]), 0",
        "expected": "20"
      }
    ]
  },
  {
    "id": "newton_q9",
    "title": "9. Postorder Traversal of BT",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Postorder Traversal of BT\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nYou are given the root of a binary tree containing N nodes. Your task is to return the postorder traversal of the given binary tree.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output. Complete the function: postorder_traversal(root).\nThe function receives the root of a binary tree and must return its postorder traversal.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of binary trees. For each test case:\n\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n \nThe next line contains space-separated integers representing the level order traversal of the tree.\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\nOutput\nReturn the postorder traversal of the binary tree as a list of node values.\nConstraints\n1 ≤ T ≤ 10\n \n1 ≤ N ≤ 104\n \n0 ≤ Node.val ≤ 104\nExample\nInput\n1\n8\n1 2 3 4 -1 5 6 -1 -1 7 8\nOutput\n4 2 7 8 5 6 3 1\nExplanation\nClick to enlarge\n\nInput\n2\n5\n1 2 3 -1 -1 4 5\n2\n10 -1 20\nOutput\n2 4 5 3 1\n20 10",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, null]), []",
        "expected": "[2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3]), []",
        "expected": "[3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, null, 3]), []",
        "expected": "[3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4]), []",
        "expected": "[4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4]), []",
        "expected": "[4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), []",
        "expected": "[5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6]), []",
        "expected": "[6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), []",
        "expected": "[7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8]), []",
        "expected": "[8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9]), []",
        "expected": "[9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), []",
        "expected": "[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), []",
        "expected": "[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), []",
        "expected": "[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), []",
        "expected": "[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), []",
        "expected": "[14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), []",
        "expected": "[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), []",
        "expected": "[16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), []",
        "expected": "[17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), []",
        "expected": "[18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), []",
        "expected": "[19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), []",
        "expected": "[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      }
    ]
  },
  {
    "id": "newton_q10",
    "title": "10. Sum of Nodes in a BT",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Sum of Nodes in a BT\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nGiven the root of a binary tree, your task is to find the sum of values of all nodes present in the binary tree without using any extra space.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\nComplete the function: sum_nodes(root)\nThe function receives the root of a binary tree and must return the sum of values of all the nodes.\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\n \nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n \nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\nOutput\nReturn an integer representing the sum of all the nodes.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\nOutput\n45\nExplanation\nThe below given tree represents the binary tree described in the input:\nClick to enlarge\n\nThe sum of node values is = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = 45\n\nInput\n2\n5\n5 3 8 -1 4 -1 10\n3\n7 -1 9 1 -1\n\nOutput\n30\n17",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, null]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4]), 10",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null]), 10",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5]), 15",
        "expected": "15"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null]), 15",
        "expected": "15"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6]), 21",
        "expected": "21"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null]), 21",
        "expected": "21"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7]), 28",
        "expected": "28"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null]), 28",
        "expected": "28"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8]), 36",
        "expected": "36"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null]), 36",
        "expected": "36"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9]), 45",
        "expected": "45"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null]), 45",
        "expected": "45"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10]), 55",
        "expected": "55"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null]), 55",
        "expected": "55"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11]), 66",
        "expected": "66"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null]), 66",
        "expected": "66"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12]), 78",
        "expected": "78"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, null, 5, null, 6, null, 7, null, 8, null, 9, null, 10, null, 11, null, 12, null]), 78"
      }
    ]
  },
  {
    "id": "newton_q11",
    "title": "11. Maximum Value in BT (No Extra Space)",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Maximum Value in BT (No Extra Space)\nEasy\nTime Limit: 2, Memory Limit: 256000\nGiven the root node of a binary tree, your task is to find the maximum node value without using any extra space.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\n\nComplete the function: max_node(root).\n\nThe function receives the root of a binary tree and must return the maximum node value in the tree.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\nThe first line contains a positive integer N, representing the number of non-null nodes.\nThe next line contains space-separated integers representing the level order traversal of the tree.\n \n\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn an integer representing the maximum node value in the given binary tree.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n\nOutput\n9\n\nExplanation\nThe following image depicts the given binary tree.\n\nClick to enlarge\n\nThe rightmost node of the last level of the tree has value 9, which is the maximum among all nodes.\n\nInput\n2\n4\n3 1 4 -1 2\n2\n7 -1 5\n\nOutput\n4\n7\n\nExplanation\nTestcase 1\nIn the first binary tree, the maximum node value is 4.\n\nTestcase 2\nIn the second binary tree, the maximum node value is 7.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q12",
    "title": "12. Count Nodes in a Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Count Nodes in a Binary Tree\nEasy\nTime Limit: 2, Memory Limit: 256000\nGiven the root of a binary tree, return the total number of nodes present in the tree.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\n\nComplete the function: node_count(root)\nThe function receives the root of a binary tree and must return the total number of nodes in the tree.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\nThe first line contains a positive integer N, representing the number of non-null nodes.\n   \nThe next line contains space-separated integers representing the level order traversal of the tree.\n \nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn an integer representing the total number of nodes in the given binary tree.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n\nOutput\n9\n\nExplanation\nThe binary tree described by the given level order traversal contains 9 non-null nodes.\n\nClick to enlarge\n\nInput\n2\n4\n1 2 3 -1 4\n2\n10 -1 20\n\nOutput\n4\n2\n\nExplanation\nThe first binary tree contains 4 non-null nodes, so the output is 4.\n\nThe second binary tree contains 2 non-null nodes, so the output is 2.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2]), 2",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, null]), 2",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4]), 4",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null]), 4",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, 5]), 5",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5]), 5",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, 7]), 7",
        "expected": "7"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7]), 7",
        "expected": "7"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8]), 8",
        "expected": "8"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null]), 8",
        "expected": "8"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, 9]), 9",
        "expected": "9"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9]), 9",
        "expected": "9"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9, 10]), 10",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9, 10, null]), 10",
        "expected": "10"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9, 10, null, 11]), 11",
        "expected": "11"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9, 10, null, null, 11]), 11",
        "expected": "11"
      },
      {
        "input": "buildTree([1, 2, null, null, 3, 4, null, null, 5, 6, null, null, 7, 8, null, null, 9, 10, null, null, 11, 12]), 12",
        "expected": "12"
      }
    ]
  },
  {
    "id": "newton_q13",
    "title": "13. Maximum Element in BT",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Maximum Element in BT\nEasy\nTime Limit: 2, Memory Limit: 256000\nGiven the root node of a binary tree, your task is to find the maximum node value in it.\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\n\nComplete the function: max_node(root)\nThe function receives the root of a binary tree and must return the maximum node value in the tree.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of test cases.\n \nFor each test case:\nThe first line contains a positive integer N, representing the number of non-null nodes.\nThe next line contains space-separated integers representing the level order traversal of the tree.\n \n\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn an integer representing the maximum node value in the given binary tree.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n9\n1 2 3 4 -1 5 6 -1 7 8 9\n\nOutput\n9\n\nExplanation\nThe following image depicts the given binary tree.\n\nClick to enlarge\n\nThe rightmost node of the last level of the tree has value 9, which is the maximum among all nodes.\n\nInput\n2\n4\n3 1 4 -1 2\n2\n7 -1 5\n\nOutput\n4\n7\n\nExplanation\nIn the first binary tree, the maximum node value is 4.\n\nIn the second binary tree, the maximum node value is 7.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, null, 3]), 1",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, 3, null, 4]), 3",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5]), 4",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, 6]), 5",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 6]), 6",
        "expected": "6"
      }
    ]
  },
  {
    "id": "newton_q14",
    "title": "14. Create given Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Create given Binary Tree\nEasy\nTime Limit: 2, Memory Limit: 256000\nCreate a Binary tree as shown in the given image. The Class Node is already defined.\n\nClick to enlarge\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function create_binary_tree().\n\nCustom Input\nThe first line of input contains a positive integer N, representing the number of nodes in the tree.\nThe next line consists of space-separated integers denoting the level order traversal of the tree, where non-negative values represent node values, and -1 indicates a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\nOutput\nReturn the root of the binary tree created.\n\nCustom Output\nThe driver code will output 1 if the constructed binary tree matches the expected structure; otherwise, it will print 0.\nExample\nInput\n7\n1 2 3 4 5 -1 -1  -1 -1 6 7\nOutput\n1",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]), 22",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 5",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, null, 4, 5, 6]), 5",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, 4, 5]), 5",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, 4]), 4",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, null, null, null, null]), 1",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 15",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), 16",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), 17",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), 18",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), 19",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), 20",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]), 21",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), 22",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]), 23",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]), 24",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]), 25",
        "expected": "true"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]), 26",
        "expected": "true"
      }
    ]
  },
  {
    "id": "newton_q15",
    "title": "15. Create a Binary Tree",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Create a Binary Tree\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nCreate a Binary tree as shown in the given image. The Class Node is already defined.\n\nClick to enlargethumbnail/assignment/question/f8795ae615f54a86a91ed9e2a994a75b.png\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output. Your task is to complete the function create_binary_tree().\n\nCustom Input\nThe first line of input contains a positive integer N, representing the number of nodes in the tree.\nThe next line consists of space-separated integers denoting the level order traversal of the tree, where non-negative values represent node values, and -1 indicates a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\nOutput\nReturn the root of the binary tree created.\n\nCustom Output\nThe driver code will output 1 if the constructed binary tree matches the expected structure; otherwise, it will print 0.\nExample\nInput\n6\n2 4 10 6 5 -1 11\nOutput\n1",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, null]), 2",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3]), 3",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, null, null]), 3",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, null, null]), 4",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, null, null]), 5",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, null, null, null, null, null, null]), 6",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, null, null, null, null, null, null, null]), 7",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, null, null, null, null, null, null, null, null, null, null, null, null]), 8",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 9",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 10",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 11",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 12",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 13",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 14",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 15",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 16",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 17",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 18",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]), 19",
        "expected": "1"
      }
    ]
  },
  {
    "id": "newton_q16",
    "title": "16. Preorder Traversal of BT",
    "difficulty": "Easy",
    "topic": "Binary Trees",
    "description": "Preorder Traversal of BT\nEasy\n2x\nxp icon\n20/20\nTime Limit: 2, Memory Limit: 256000\nYou are given the root of a binary tree containing N nodes. Your task is to return the preorder traversal of the given binary tree.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to handle input or output.\n\nComplete the function: preorder_traversal(root) The function receives the root of a binary tree and must return its preorder traversal.\n\nCustom Input Format\nThe first line contains a positive integer T, representing the number of binary trees.\n\nFor each test case:\n\nThe first line contains a positive integer N, representing the number of non-null nodes.\n \nThe next line contains space-separated integers representing the level order traversal of the tree.\nA value of -1 represents a null node.\nNote: Once a node is marked as -1, no further information about its children is provided.\n\nOutput\nReturn the preorder traversal of the binary tree as a list of node values.\nConstraints\n1\n≤\nT\n≤\n10\n1≤T≤10\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\n≤\n1\n0\n4\n0≤Node.val≤10 \n4\n \nExample\nInput\n1\n8\n1 2 3 4 -1 5 6 -1 -1 7 8\nOutput\n1 2 4 3 5 7 8 6\nExplanation\nClick to enlarge\n\nInput\n2\n5\n1 2 3 -1 -1 4 5\n2\n10 -1 20\nOutput\n1 2 3 4 5\n10 20",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 1",
        "expected": "[1]"
      },
      {
        "input": "buildTree([1, 2]), 2",
        "expected": "[1, 2]"
      },
      {
        "input": "buildTree([1, 2, null]), 3",
        "expected": "[1, 2]"
      },
      {
        "input": "buildTree([1, 2, null, 3]), 4",
        "expected": "[1, 2, 3]"
      },
      {
        "input": "buildTree([1, 2, null, 3, null, 4]), 6",
        "expected": "[1, 2, 4, 3]"
      },
      {
        "input": "buildTree([1, 2, null, 3, null, 4, null, 5]), 8",
        "expected": "[1, 2, 4, 5, 3]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 7",
        "expected": "[1, 2, 3, 4, 5, 6, 7]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8]), 9",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null]), 11",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9]), 13",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null]), 15",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10]), 17",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null]), 19",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11]), 21",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null]), 23",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12]), 25",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12, null, null]), 27",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12, null, null, 13]), 29",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12, null, null, 13, null, null]), 31",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12, null, null, 13, null, null, 14]), 33",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, null, null, 8, null, null, 9, null, null, 10, null, null, 11, null, null, 12, null, null, 13, null, null, 14, null, null]), 35",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]"
      }
    ]
  },
  {
    "id": "newton_q17",
    "title": "17. Add two numbers",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Add two numbers\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 128000\nTwo numbers are represented in Linked List such that each digit corresponds to a node in the linked list. Your task is to add these two numbers and return the sum in a linked list.\nNote:- Linked list representation of a number is from left to right i.e if the number is 123 then in the linked list it is represented as 3->2->1\nInput\nUser Task:\nSince this will be a functional problem, you don't have to take input. You just have to complete the function addNumber() that takes head nodes of both the linked lists as parameters.\n\nCustom Input:\nA single line containing two space-separated integers representing the two numbers.\nConstraints:\n1 <=numbers<=101000\nOutput\nReturn head of resulting linked list (again in reverse order).\nExample\nSample Input:-\n1234 45643\n\nSample Output:-\n46877",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5, 6])",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3]), buildList([0, 0, 0])",
        "expected": "1"
      },
      {
        "input": "buildList([0, 0, 0]), buildList([1, 2, 3])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5])",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5, 6, 7])",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4]), buildList([5, 6, 7])",
        "expected": "8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([6, 7])",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6]), buildList([7])",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7]), buildList([])",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7]), buildList([8, 9])",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8]), buildList([9])",
        "expected": "8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), buildList([])",
        "expected": "9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), buildList([])",
        "expected": "0"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]), buildList([])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2]), buildList([])",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3]), buildList([])",
        "expected": "3"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4]), buildList([])",
        "expected": "4"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5]), buildList([])",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6]), buildList([])",
        "expected": "6"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7]), buildList([])",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8]), buildList([])",
        "expected": "8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), buildList([])",
        "expected": "9"
      }
    ]
  },
  {
    "id": "newton_q18",
    "title": "18. Detect Linked List Cycle",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Detect Linked List Cycle\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nGiven the head node of a singly linked list, determine whether the list contains a cycle.\n\nNote: A linked list contains a cycle if, by following the next pointers, a node is encountered more than once during traversal.\n\nInput\nUser Task\nSince this is a functional problem, you don't have to take any input. You just have to complete the function detectCycle() that takes the head node of the linked list as its parameter.\n\nCustom Input\nThe input consists of three lines:\nThe first line contains a single integer N, denoting the number of nodes in the linked list.\nThe second line contains N space-separated integers, representing the elements of the linked list.\nThe third line contains a single integer pos, indicating the index of the node to which the tail points. If pos is -1, the linked list does not contain a cycle.\n\nConstraints\n1\n≤\nN\n≤\n1\n0\n4\n1≤N≤10 \n4\n \n−\n1\n0\n5\n≤\nN\no\nd\ne\n.\nd\na\nt\na\n≤\n1\n0\n5\n−10 \n5\n ≤Node.data≤10 \n5\n \n−\n1\n≤\np\no\ns\n<\nN\n−1≤pos<N\nOutput\nReturn Boolean \"True\" if the given linked list contains a cycle, otherwise return \"False\" (without quotes).\nExample\nInput\n4\n3 2 0 -4\n1\nOutput\nTrue\nExplanation\nThe third line of input indicates that the next node after the last node of the linked list is the second node (i.e., the node at index 1). Therefore, the linked list contains a cycle.\n\nInput\n4\n3 2 0 -4\n-1\nOutput\nFalse\nExplanation\nThe value of pos is -1, indicating that the given linked list does not contain a cycle.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), 0",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 0",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 1",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 2",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 3",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 4",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 1",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 2",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 3",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 4",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 5",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 6",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 7",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 8",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 9",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 10",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), -1",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 11",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "newton_q19",
    "title": "19. Reverse Linked List in K-Groups",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Reverse Linked List in K-Groups\nHard\nxp icon\n30/60\nTime Limit: 2, Memory Limit: 256000\nGiven the head of a linked list, reverse the nodes of the list k at a time, and return the head of the modified list.\n\nk is a positive integer and is less than or equal to the length of the linked list.\nIf the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.\n\nNOTE: Modify the original linked list only. The use of list is not allowed.\nInput\nUser Task\nThis is a functional problem. You don't have to take any input. You are required to complete the function reverseInKGroup that takes a node head and an integer k as parameters.\nOutput\nReturn the head of the modified Linked List.\nConstraints\n1 ≤ N ≤ 104, N being the size of the Initial Linked List.\n0 ≤ Node.data ≤ 104\n0 ≤ k ≤ N\nExample\nInput:\n5 2\n5 10 15 20 12\nOutput:\n10 5 20 15 12\n\nExplanation:\nThe given input represents a linked list with elements 5 → 10 → 15 → 20 → 12 and the value k = 2.\n\nThis means we have to reverse the linked list in groups of size 2.\n\nIn the first group, the nodes 5 and 10 are reversed to become 10 → 5.\nIn the second group, the nodes 15 and 20 are reversed to become 20 → 15.\n\nThe last node 12 does not form a complete group of size 2, so it remains unchanged.\n\nAfter combining all the parts, the final linked list becomes 10 → 5 → 20 → 15 → 12.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3, 4, 5]), 2",
        "expected": "2 1 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "1 2 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 1",
        "expected": "1 2 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 0",
        "expected": "1 2 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 7",
        "expected": "1 2 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 3",
        "expected": "3 2 1 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 4",
        "expected": "4 3 2 1 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 6",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 7",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 8",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 9",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 10",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 11",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 12",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 13",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 14",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 15",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 16",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 17",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 18",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 19",
        "expected": "5 4 3 2 1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 20",
        "expected": "5 4 3 2 1"
      }
    ]
  },
  {
    "id": "newton_q20",
    "title": "20. Reversing the Linked List",
    "difficulty": "Medium",
    "topic": "Linked Lists",
    "description": "Reversing the Linked List\nMedium\nTime Limit: 2, Memory Limit: 128000\nGiven a linked list of N nodes. Reverse the list by changing links between nodes (if the list is 1 2 3 4, it becomes 4 3 2 1) and return the modified list.\n\nInput\nUser Task\nSince this is a functional problem, complete the function reverseLL() that takes a node head as parameter.\n\nConstraints\n1 ≤ N ≤ 1000\n0 ≤ Node.data ≤ 100\n\nCustom Input\nThe first line contains n, followed by n space-separated linked-list values.\n\nOutput\nReturn the head of the modified linked list.\n\nExample\nInput:\n6\n1 2 3 4 5 6\nOutput:\n6 5 4 3 2 1\n\nExplanation\nAfter reversing the list, the elements are 6 5 4 3 2 1.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1]), null",
        "expected": "[1]"
      },
      {
        "input": "buildList([1, 2]), null",
        "expected": "[2, 1]"
      },
      {
        "input": "buildList([1, 2, 3]), null",
        "expected": "[3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4]), null",
        "expected": "[4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), null",
        "expected": "[5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6]), null",
        "expected": "[6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7]), null",
        "expected": "[7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8]), null",
        "expected": "[8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), null",
        "expected": "[9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), null",
        "expected": "[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), null",
        "expected": "[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), null",
        "expected": "[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), null",
        "expected": "[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), null",
        "expected": "[14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), null",
        "expected": "[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), null",
        "expected": "[16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), null",
        "expected": "[17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), null",
        "expected": "[18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), null",
        "expected": "[19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), null",
        "expected": "[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
      }
    ]
  },
  {
    "id": "newton_q21",
    "title": "21. Merge two sorted linked list",
    "difficulty": "Medium",
    "topic": "Linked Lists",
    "description": "Merge two sorted linked list - Debug 2\nMedium\nxp icon\n0/40\nTime Limit: 2, Memory Limit: 128000\nGiven two sorted linked list of size n and m (sizes may or may not be same), your task is to merge them such that resultant list is also sorted, and return the head node of the merged list.\nInput\nUser Task:\nSince this will be a functional problem, you don't have to take input. You just have to complete the function Merge() that takes the head node of both the linked list as the parameter.\nOutput\nReturn the head of the merged linked list.\nConstraints\n1 < =  n, m < = 1000\n1 < =  head1.data < = 10000\n1 < =  head2.data < = 10000\nExample\nSample Input:\n5 6\n1 2 3 4 5\n3 4 6 8 9 10\n\nSample Output:\n1 2 3 3 4 4 5 6 8 9 10",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5, 6])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), buildList([6, 5, 4])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5, 6, 7])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4]), buildList([5, 6, 7])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([6, 7, 8])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6]), buildList([7, 8, 9])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7]), buildList([8, 9, 10])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8]), buildList([9, 10, 11])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), buildList([10, 11, 12])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), buildList([11, 12, 13])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), buildList([12, 13, 14])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), buildList([13, 14, 15])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), buildList([14, 15, 16])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), buildList([15, 16, 17])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), buildList([16, 17, 18])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), buildList([17, 18, 19])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), buildList([18, 19, 20])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), buildList([19, 20, 21])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), buildList([20, 21, 22])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), buildList([21, 22, 23])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]), buildList([22, 23, 24])",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), buildList([23, 24, 25])",
        "expected": "1"
      }
    ]
  },
  {
    "id": "newton_q22",
    "title": "22. Intersection of two linked list",
    "difficulty": "Medium",
    "topic": "Linked Lists",
    "description": "Intersection of two linked list - Debug 1\nMedium\nTime Limit: 2, Memory Limit: 128000\nGiven the heads of two singly linked lists head1 and head2, return the node at which the two lists intersect. If the two linked lists have no intersection at all, return null For example, the following two linked lists begin to intersect at node c1\n\nClick to enlargethumbnail/assignment/question/604e844683a1426da4a5137b9bb93454.png\nInput\nUser Task:\nSince this will be a functional problem, you don't have to take input. You just have to complete the function intersection() that takes the head node of both lists as a parameter.\n\nThe first line of the input contains:\nthe size of the 1st linked list\nsize of 2nd linked list\nthe size of the common part of two linked lists\n\nThe rest of the input contains:\nelements of 1st linked list\nelements of 2nd linked list\ncommon part of two linked lists\nOutput\nReturn the node of intersection\nExample\nSample Input:-\n4 3 4\n1 2 3 4\n5 6 7\n9 10 11 12\n\nSample Output:-\n9\n\nExplanation:\n 1 -> 2 -> 3 -> 4\n                               |\n       9 -> 10 -> 11 -> 12\n                               |\n     5 -> 6 -> 7",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), buildList([4, 5, 6])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3]), buildList([1, 2, 3])",
        "expected": 2
      },
      {
        "input": "buildList([1, 2, 3]), buildList([1, 2, 3, 4])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3]), buildList([1, 2])",
        "expected": 2
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3])",
        "expected": 3
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4])",
        "expected": 4
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5])",
        "expected": 5
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])",
        "expected": null
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])",
        "expected": null
      }
    ]
  },
  {
    "id": "newton_q23",
    "title": "23. Delete node without head pointer",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Delete node without head pointer - Debug 1\nEasy\nTime Limit: 2, Memory Limit: 128000\nGiven a node of a linked list containing N unique nodes i.e the value at each node is unique, your task is to delete the given node from the list.\n\nNote:- It is guaranteed that the given node is not the last node of the list and is always present in the linked list.\nInput\nUser Task:\nSince this will be a functional problem, you don't have to take input. You just have to complete the function deleteNode() that takes the curr_node (node to be deleted) as parameter.\n\nConstraints\n1 <= N <= 1000\n1 < = Node.data < = 100000\n\nCustom Input:-\nFirst line should contains number of Nodes N and the node val to be deleted, next line contains N space separated integers denoting the values of nodes.\nOutput\nYou don't need to print or return anything printing will be done by the driver code.\nExample\nInput:-\n4 3\n2 3 4 5\n\nOutput:-\n2 4 5",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 3",
        "expected": "1 2 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "1 2 3 4"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 1",
        "expected": "2 3 4 5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "1 2 3 4 5 6 7 8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1",
        "expected": "2 3 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 5",
        "expected": "1 2 3 4 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "1 2 3 4 5 6 7 8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 8",
        "expected": "1 2 3 4 5 6 7 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 7",
        "expected": "1 2 3 4 5 6 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 6",
        "expected": "1 2 3 4 5 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 4",
        "expected": "1 2 3 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 3",
        "expected": "1 2 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 2",
        "expected": "1 3 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1",
        "expected": "2 3 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "1 2 3 4 5 6 7 8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 0",
        "expected": "1 2 3 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 10",
        "expected": "1 2 3 4 5 6 7 8 9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "1 2 3 4 5 6 7 8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "1 2 3 4 5 6 7 8"
      }
    ]
  },
  {
    "id": "newton_q24",
    "title": "24. Size of Linked List",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Size of Linked List\nEasy\nTime Limit: 2, Memory Limit: 256000\nYou are given the head of a linked list. Find the size of the linked list.\n\nInput\nUser Task\nComplete the function sizeOfLinkedList that takes a node head as parameter.\n\nOutput\nReturn the size of the linked list.\n\nConstraints\n0 ≤ Node.data ≤ 10^4\nhead is not None\n\nExample\nInput: 5 10 15 20\nOutput: 4\n\nInput: 3 13 2 19 14 10\nOutput: 6",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1]), 1",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2]), 2",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "3"
      },
      {
        "input": "buildList([1, 2, 3, 4]), 4",
        "expected": "4"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6]), 6",
        "expected": "6"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7]), 7",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8]), 8",
        "expected": "8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9]), 9",
        "expected": "9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 10",
        "expected": "10"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), 11",
        "expected": "11"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), 12",
        "expected": "12"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), 13",
        "expected": "13"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), 14",
        "expected": "14"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 15",
        "expected": "15"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), 16",
        "expected": "16"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), 17",
        "expected": "17"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), 18",
        "expected": "18"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), 19",
        "expected": "19"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), 20",
        "expected": "20"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]), 21",
        "expected": "21"
      }
    ]
  },
  {
    "id": "newton_q25",
    "title": "25. Search an element in Linked List",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Search an element in Linked List\nEasy\nTime Limit: 2, Memory Limit: 256000\nYou are given the head of a singly linked list and an integer X. Find whether X is present in the linked list.\n\nIf X is present, return True; otherwise return False.\n\nInput\nUser Task\nComplete the function findElementInLinkedList that takes a node head and an integer X as parameters.\n\nOutput\nReturn True if X is present and False otherwise.\n\nConstraints\n0 ≤ N ≤ 10^4\n0 ≤ Node.data ≤ 10^4\n0 ≤ X ≤ 10^4\n\nExample\nInput:\n4\n5 10 15 20\n18\nOutput:\nFalse\n\nInput:\n5\n5 13 110 22 3\n13\nOutput:\nTrue",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 4",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 0",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), -1",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "true"
      },
      {
        "input": "buildList([1, 2, 3]), 10",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 100",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 1000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 10000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 100000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 1000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 10000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 100000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 1000000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 10000000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 100000000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 1000000000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 10000000000000",
        "expected": "false"
      },
      {
        "input": "buildList([1, 2, 3]), 100000000000000",
        "expected": "false"
      }
    ]
  },
  {
    "id": "newton_q26",
    "title": "26. Insert node at the given position",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Insert node at the given position\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 128000\nGiven a linked list consisting of N nodes and two integers M and K. Your task is to add element K at the Mth position from the start of the linked list\nInput\nUser Task:\nSince this will be a functional problem, you don't have to take input. You just have to complete the function addElement() that takes head node, M(position of element to be inserted) and K(the element to be inserted) as parameter.\n\nConstraints:\n1 <= M <=N <= 1000\n1 <=K, Node.data<= 1000\nOutput\nReturn the head of the modified linked list\nExample\nSample Input:-\n5 3 2\n1 3 2 4 5\n\nSample Output:-\n1 3 2 2 4 5\n\nExplanation:-\nhere M is 3 and K is 2\nso we insert 2 at the 3rd position, resulting list will be 1 3 2 2 4 5\n\nSample Input 2:-\n5 2 6\n1 2 3 4 5\n\nSample Output 2:-\n1 6 2 3 4 5",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), 1, 4",
        "expected": "1 4 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 3, 4",
        "expected": "1 2 3 4"
      },
      {
        "input": "buildList([1, 2, 3]), 5, 4",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 0, 4",
        "expected": "4 1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 0",
        "expected": "1 0 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 2, -1",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 1",
        "expected": "1 1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 3, 1",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 1000",
        "expected": "1 1000 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 3, 1000",
        "expected": "1 2 3 1000"
      },
      {
        "input": "buildList([1, 2, 3]), 5, 1000",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 0, 1000",
        "expected": "1000 1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 1000",
        "expected": "1 1000 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 2, 1000",
        "expected": "1 2 1000 3"
      },
      {
        "input": "buildList([1, 2, 3]), 3, 1000",
        "expected": "1 2 3 1000"
      },
      {
        "input": "buildList([1, 2, 3]), 4, 1000",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 1000",
        "expected": "1 1000 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 2, 1000",
        "expected": "1 2 1000 3"
      },
      {
        "input": "buildList([1, 2, 3]), 3, 1000",
        "expected": "1 2 3 1000"
      },
      {
        "input": "buildList([1, 2, 3]), 4, 1000",
        "expected": "1 2 3"
      },
      {
        "input": "buildList([1, 2, 3]), 1, 1000",
        "expected": "1 1000 2 3"
      }
    ]
  },
  {
    "id": "newton_q27",
    "title": "27. Delete node at the beginning of the Linked List",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Delete node at the beginning of the Linked List\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nImplement the deleteAtHead function that allows the deletion of the head of the Linked List.\nInput\nUser Task\nThis is a function problem. You don't have to take any input. You are required to complete the function deleteAtHead that takes a node head as parameter.\n\nConstraints\n0 ≤ N ≤ 104, N being the size of the Initial Linked List.\n0 ≤ Node.data ≤ 109\nOutput\nReturn the head of the Linked List after deleting the head of the Linked List.\nExample\nInput:\n4\n5 10 15 20\nOutput:\n10 15 20\n\nExplanation:\nLinkedList LL : 5->10- >15- >20\nWhen the initial deleteAtHead function is invoked, the node containing the value 5 will be deleted.\n10->15->20",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([5]), null",
        "expected": "null"
      },
      {
        "input": "buildList([5, 10]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]), 5",
        "expected": "10"
      },
      {
        "input": "buildList([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105]), 5",
        "expected": "10"
      }
    ]
  },
  {
    "id": "newton_q28",
    "title": "28. Delete node at the end of the Linked List",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Delete node at the end of the Linked List\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nImplement the deleteAtTail function that allows the deletion at the end of the Linked List.\nInput\nUser Task\nThis is a function problem. You don't have to take any input. You are required to complete the function deleteAtTail that takes a node head as parameter.\n\nConstraints\n0 ≤ N ≤ 104, N being the size of the Initial Linked List.\n0 ≤ Node.data ≤ 109\nOutput\nReturn the head of the Linked List after deleting the node.\nExample\nInput:\n4\n5 10 15 20\nOutput:\n5 10 15\n\nExplanation:\nLinkedList LL : 5->10- >15- >20\nWhen the deleteAtTail function is invoked, the node containing the value 20 will be deleted.\nLinkedList LL : 5->10->15",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 0",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 4",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), -1",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 0",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 4",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), -1",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 0",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 4",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), -1",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "1"
      }
    ]
  },
  {
    "id": "newton_q29",
    "title": "29. Delete Kth Node from the List",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Delete Kth Node from the List\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nYou are given the head of a singly linked list and an integer K. Your task is to delete the Kth node (1-based index) from the beginning of the linked list.\n\nReturn the head of the modified linked list after the deletion.\nInput\nUser Task\nSince this is a functional problem, you do not need to take input. Your task is to complete the function delete_kth_node() that takes the head node of a linked list and an integer K as the input parameters.\n\nCustom Input\nThe first line of input contains two space-separated integers, N and K, the number of nodes in the linked list and the position of node to be deleted.\nThe second and final line of input contains N space-separated integers, representing the values of the nodes in the linked list\n\nConstraints\n1\n≤\nN\n≤\n1\n0\n5\n1≤N≤10 \n5\n \n0\n≤\nN\no\nd\ne\n.\nv\na\nl\nu\ne\n≤\n1\n0\n5\n0≤Node.value≤10 \n5\n \n1\n≤\nK\n≤\nN\n1≤K≤N\nOutput\nReturn the head of the modified linked list after the deletion.\n\nNote: Return None if the linked list becomes empty after the deletion. In such a case, the main function will print -1.\nExample\nInput:\n4 3\n5 10 15 20\n\nOutput:\n5 10 20\n\nExplanation:\nLinkedList LL : 5->10->15->20\nThe node at index 3 is deleted.\nLinkedList LL : 5->10->20\n\nInput:\n1 1\n5\n\nOutput:\n-1\n\nExplanation:\nLinkedList LL : 5\nAfter deleting the first and only element, the linked list becomes empty. Thus, the main function will print -1.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildList([1]), 1",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3]), 1",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3]), 3",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3]), 4",
        "expected": "3"
      },
      {
        "input": "buildList([1, 2, 3]), 5",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 3",
        "expected": "3"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 4",
        "expected": "4"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 5",
        "expected": "5"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5]), 6",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 1",
        "expected": "2"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 2",
        "expected": "1"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 10",
        "expected": "10"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 11",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 11",
        "expected": "null"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 5",
        "expected": "6"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 6",
        "expected": "7"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 7",
        "expected": "8"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 8",
        "expected": "9"
      },
      {
        "input": "buildList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 9",
        "expected": "10"
      }
    ]
  },
  {
    "id": "newton_q30",
    "title": "30. Create Node Class and then create LinkedList",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Create Node Class and then create LinkedList\nEasy\nxp icon\n10/20\nTime Limit: 2, Memory Limit: 256000\nYou are required to create a singly linked list with the following structure:\n\n30\n→\n40\n→\n50\n→\n60\n→\n70\n→\nN\nU\nL\nL\n30→40→50→60→70→NULL\n\nEach node of the linked list should contain:\n\nan integer value, and\n\na reference to the next node.\n\nYou have to complete the Node class for the linked list and then create this linked list in the given order.\n\nAfter creating the linked list, return the head node of the list.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to take any input.\nYour task is to complete the function buildLinkedList() by: completing the Node class, and creating a singly linked list containing the values \n30\n,\n40\n,\n50\n,\n60\n,\n70\n30,40,50,60,70 in the given order.\nReturn the head node of the linked list.\nOutput\nReturn the head node of the linked list.\n\nCustom Output\nPrints True if the linked list structure is correct.\nPrints the linked list values in order.\nExample\nOutput\n\nTrue\n30 40 50 60 70\n\nExplanation\nThe linked list should be created as follows:\nHead node value = \n30\n30\nHead next node = \n40\n40\nNode with value \n40\n40 points to \n50\n50\nNode with value \n50\n50 points to \n60\n60\nNode with value \n60\n60 points to \n70\n70\nNode with value \n70\n70 points to \nN\nU\nL\nL\nNULL\nIf the linked list is created correctly, the structure check will return True, followed by the values of the linked list printed in order.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildLinkedList(), null",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "60"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "70"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "60"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "70"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "null"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 60",
        "expected": "60"
      },
      {
        "input": "buildLinkedList(), 70",
        "expected": "70"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 60",
        "expected": "60"
      },
      {
        "input": "buildLinkedList(), 70",
        "expected": "70"
      }
    ]
  },
  {
    "id": "newton_q31",
    "title": "31. Build My LinkedList",
    "difficulty": "Easy",
    "topic": "Linked Lists",
    "description": "Build My LinkedList\nEasy\nTime Limit: 2, Memory Limit: 256000\nYou are required to create a singly linked list with the following structure:\n\n30 -> 40 -> 50 -> NULL\nEach node contains an integer value and a reference to the next node.\n\nAfter creating the linked list, return the head node of the list.\n\nInput\nUser Task\nSince this is a functional problem, you do not need to take any input.\nYour task is to complete the function buildLinkedList() by creating a linked list containing the values 30, 40, and 50 in the given order. Return the head node of the linked list.\nOutput\nReturn the head node of the linked list.\n\nCustom Output\nPrints True if the linked list structure is correct.\nPrints the linked list values in order.\nExample\nOutput\nTrue\n30 40 50\n\nExplanation\nThe linked list should be created as follows:\nHead node value = 30\nHead next node = 40\nNode with value 40 next = 50\nNode with value 50 next = NULL",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), null",
        "expected": "null"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      },
      {
        "input": "buildLinkedList(), 30",
        "expected": "30"
      },
      {
        "input": "buildLinkedList(), 40",
        "expected": "40"
      },
      {
        "input": "buildLinkedList(), 50",
        "expected": "50"
      }
    ]
  },
  {
    "id": "newton_q32",
    "title": "32. Merge By Parity",
    "difficulty": "Medium",
    "topic": "Arrays",
    "description": "Merge By Parity\nMedium\nTime Limit: 2, Memory Limit: 256000\nGiven two sorted arrays arr and brr of sizes N and M, merge both arrays and rearrange the result so that all even numbers appear first in ascending order, followed by all odd numbers in ascending order.\n\nInput\nThe first line contains N and M. The second line contains N values of arr. The third line contains M values of brr.\n\nOutput\nPrint the N + M values of the merged array.\n\nConstraints\n1 ≤ N, M ≤ 10^5\n1 ≤ arr[i], brr[j] ≤ 10^5\n\nExample\nInput\n3 5\n3 5 9\n2 6 8 9 10\nOutput\n2 6 8 10 3 5 9 9",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "\"1\"",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q33",
    "title": "33. MergeSort",
    "difficulty": "Medium",
    "topic": "Arrays",
    "description": "MergeSort\nMedium\nTime Limit: 2, Memory Limit: 128000\nRead n elements and sort the array using merge sort.\n\nInput\nThe first line contains n. The next line contains n space-separated integers.\n\nOutput\nPrint the sorted list of elements.\n\nExample\nInput\n5\n3 4 1 6 9\nOutput\n1 3 4 6 9",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "\"1\"",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q34",
    "title": "34. Generate All Stairs Path",
    "difficulty": "Easy",
    "topic": "Algorithms",
    "description": "Generate All Stairs Path\nEasy\nTime Limit: 2, Memory Limit: 256000\nYou are given a staircase with n steps. Generate all possible paths to reach the top when a move can advance by one or two steps. Return the paths in the required order.\n\nInput\nA single integer n.\n\nOutput\nReturn all valid paths from step 0 to step n.\n\nConstraints\n1 ≤ n ≤ 20\n\nExample\nInput\n3\nOutput\n[1 1 1, 1 2, 2 1]",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 3",
        "expected": "[[1, 1, 1], [1, 2], [2, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 4",
        "expected": "[[1, 1, 1, 1], [1, 1, 2], [1, 2, 1], [2, 1, 1], [1, 3], [3, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 5",
        "expected": "[[1, 1, 1, 1, 1], [1, 1, 1, 2], [1, 1, 2, 1], [1, 2, 1, 1], [1, 1, 3], [1, 3, 1], [2, 1, 1, 1], [3, 1, 1], [1, 4], [4, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 6",
        "expected": "[[1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 2], [1, 1, 1, 2, 1], [1, 1, 2, 1, 1], [1, 1, 1, 3], [1, 1, 3, 1], [1, 2, 1, 1, 1], [1, 1, 4], [1, 4, 1], [2, 1, 1, 1, 1], [2, 1, 2], [2, 2, 1], [3, 1, 1, 1], [4, 1, 1], [1, 5], [5, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 1",
        "expected": "[[1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 0",
        "expected": "[]"
      },
      {
        "input": "buildTree([1, 2, 3]), 20",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 21",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 19",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 18",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 17",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 16",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 15",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 14",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 13",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 12",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 11",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 10",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 9",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1, 1]]"
      },
      {
        "input": "buildTree([1, 2, 3]), 8",
        "expected": "[[1, 1, 1, 1, 1, 1, 1, 1]]"
      }
    ]
  },
  {
    "id": "newton_q35",
    "title": "35. Generate All Stairs Path - II",
    "difficulty": "Medium",
    "topic": "Algorithms",
    "description": "Generate All Stairs Path - II\nMedium\nTime Limit: 2, Memory Limit: 256000\nGiven n stairs and allowed jumps of one, two, or three steps, generate every possible path to reach the top.\n\nInput\nA single integer n.\n\nOutput\nReturn all valid jump sequences whose sum is n.\n\nConstraints\n1 ≤ n ≤ 20\n\nExample\nInput\n4\nOutput\n[1 1 1 1, 1 1 2, 1 2 1, 2 1 1, 2 2, 1 3, 3 1]",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "\"1\"",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q36",
    "title": "36. Replace Character - using recursion",
    "difficulty": "Easy",
    "topic": "Strings",
    "description": "Replace Character - using recursion\nEasy\nGiven a string s, a character ch, and a replacement character rep, replace every occurrence of ch in s with rep using recursion.\n\nInput\nThe input contains the string and the two characters.\n\nOutput\nPrint the modified string.\n\nConstraints\n1 ≤ len(s) ≤ 10^4\n\nExample\nInput\naabbaca\na\nx\nOutput\nxxbbxcx",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 'a'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'y'",
        "expected": "xyybxycy"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'y'",
        "expected": "xyybxycy"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'y'",
        "expected": "xyybxycy"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'z'",
        "expected": "zzzbxzcz"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'z'",
        "expected": "zzzbxzcz"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'z'",
        "expected": "zzzbxzcz"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'a'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'b'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'c'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'a', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'b', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'c', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'a', 'a'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'b', 'b'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'c', 'c'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a', 'a', 'a', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'b', 'b', 'b', 'x'",
        "expected": "xxbbxcx"
      },
      {
        "input": "buildTree([1, 2, 3]), 'c', 'c', 'c', 'x'",
        "expected": "xxbbxcx"
      }
    ]
  },
  {
    "id": "newton_q37",
    "title": "37. Count the vowels - using recursion",
    "difficulty": "Easy",
    "topic": "Strings",
    "description": "Count the vowels - using recursion - Debug 1\nEasy\nxp icon\n0/20\nTime Limit: 2, Memory Limit: 256000\nYou are given a string S that contains only lowercase English letters.\nYour task is to write a Python program that counts how many vowels appear in the string.\n\nThe vowels to consider are: a, e, i, o, and u.\nNote: You must solve this problem using recursion only. The use of loops (for, while) or any iterative approach is strictly not allowed.\n\n \n\nInput\nThe first and only line of input contains the string S.\nOutput\nPrint an integer - the count of vowels in the given string.\nConstraints\n1\n≤\nl\ne\nn\n(\nS\n)\n≤\n500\n1≤len(S)≤500\nS contains only lowercase English letters (a–z).\nExample\nInput\nnewtonschool\nOutput\n4\nExplanation\nThe vowels in \"newtonschool\" are: e, o, o, o\nTotal = 4 vowels\n\nInput\npython\nOutput\n1\nExplanation\nThe only vowel in \"python\" is o",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1]), 'a'",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2]), 'a'",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]), 'a'",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]), 'a'",
        "expected": "1"
      }
    ]
  },
  {
    "id": "newton_q38",
    "title": "38. Print Subsequences - II",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Print Subsequences - II - Debug 1\nMedium\nxp icon\n0/40\nTime Limit: 2, Memory Limit: 256000\nYou are given a string s consisting of lowercase English letters. A subsequence is a string that can be obtained by deleting zero or more characters (not necessarily contiguous) from s.\n\nYour task is to print non-empty subsequences of the string.\n\nInput\nUser Task  \nThis is a function problem. You don’t have to take any input. You are required to complete the function print_subsequences() that takes a string s as a parameter and prints all non-empty subsequences of string s new line.\n\nCustom Input  \nThe only line contains a string s, consisting of lowercase English letters.\nOutput\nPrint all non-empty subsequences of string s in new line.\nConstraints\n1\n≤\nn\n≤\n16\n1≤n≤16 — where n is the length of the input string s  \ns\ns consists of only lowercase English letters (\n′\na\n′\n′\n a \n′\n  to \n′\nz\n′\n′\n z \n′\n )\nExample\nInput:\nabc\n\nOutput:\nabc\nab\nac\na\nbc\nb\nc\n\nExplanation:\nWe generate all possible subsequences by choosing or skipping each character.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "\"1\""
      }
    ]
  },
  {
    "id": "newton_q39",
    "title": "39. Generate All Subsequences of a String",
    "difficulty": "Medium",
    "topic": "Binary Trees",
    "description": "Generate All Subsequences of a String - Debug 1\nMedium\nxp icon\n0/40\nTime Limit: 2, Memory Limit: 256000\nYou are given a string s. Your task is to generate all possible non-empty subsequences of the string and return them as a nested list, where each subsequence is represented as a list of characters.\n\nA subsequence is obtained by deleting zero or more characters from the string without changing the relative order of the remaining characters.\n\nInput\nUser Task\n\nYou do not need to handle input. Your task is to complete the function\nall_subsequences(s), which takes a string s as its parameter and\nreturns a nested list containing all non-empty subsequences of the string.\nEach subsequence must be represented as a list of characters.\n\nCustom Input\nThe input will consist of a single line containing the string s.\n\nOutput\n\nReturn a list of lists, where each inner list represents a\nnon-empty subsequence of the input string s.\n\nConstraints\n1\n≤\nl\ne\nn\n(\ns\n)\n≤\n10\n1≤len(s)≤10\nExample\nInput\n\nabc\nOutput\n\n[\n  ['a', 'b', 'c'], ['a', 'b'], ['a', 'c'], ['a'], ['b', 'c'], ['b'], ['c']\n]\nExplanation\n\nAll possible non-empty subsequences of the string \"abc\" are generated.\nEach subsequence is stored as a list of characters, and all such lists\nare combined into a nested list, which is returned as the output.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildString('abc'), []",
        "expected": "[['a'], ['a', 'b'], ['a', 'c'], ['b'], ['b', 'c'], ['c']]"
      },
      {
        "input": "buildString(''), []",
        "expected": "[]"
      },
      {
        "input": "buildString('a'), []",
        "expected": "[['a']]"
      },
      {
        "input": "buildString('abc'), ['a']",
        "expected": "[['a', 'b', 'c'], ['a', 'b'], ['a', 'c'], ['a'], ['b', 'c'], ['b'], ['c']]"
      },
      {
        "input": "buildString('abc'), ['b']",
        "expected": "[['b', 'c'], ['b'], ['c']]"
      },
      {
        "input": "buildString('abc'), ['c']",
        "expected": "[['c'], ['c']]"
      },
      {
        "input": "buildString('abc'), ['a', 'b']",
        "expected": "[['a', 'b', 'c'], ['a', 'b'], ['a', 'c'], ['b', 'c'], ['b'], ['c']]"
      },
      {
        "input": "buildString('abc'), ['a', 'c']",
        "expected": "[['a', 'b', 'c'], ['a', 'b'], ['b', 'c'], ['b'], ['c']]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']",
        "expected": "[[]]"
      },
      {
        "input": "buildString('abc'), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q']",
        "expected": "[[]]"
      }
    ]
  },
  {
    "id": "newton_q40",
    "title": "40. Column Wise Matrix Traversal",
    "difficulty": "Easy",
    "topic": "Arrays",
    "description": "Column Wise Matrix Traversal\nEasy\nGiven a matrix with n rows and m columns, print or return its elements column by column from left to right.\n\nInput\nThe first line contains n and m. The next n lines contain the matrix elements.\n\nOutput\nTraverse the matrix column-wise.\n\nExample\nInput\n2 3\n1 2 3\n4 5 6\nOutput\n1 4 2 5 3 6",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0)",
        "expected": "[1, 4, 2, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 1)",
        "expected": "[1, 2, 4, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 2)",
        "expected": "[1, 3, 4, 6, 2, 5]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 3)",
        "expected": "[2, 3, 5, 6, 1, 4]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 4)",
        "expected": "[3, 6, 2, 5, 1, 4]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 5)",
        "expected": "[6, 2, 5, 1, 4, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 6)",
        "expected": "[2, 5, 3, 1, 4, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 7)",
        "expected": "[5, 3, 6, 2, 1, 4]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 8)",
        "expected": "[3, 6, 1, 2, 4, 5]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 9)",
        "expected": "[6, 1, 5, 4, 2, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 10)",
        "expected": "[1, 5, 2, 4, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 11)",
        "expected": "[5, 2, 6, 1, 4, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 12)",
        "expected": "[2, 6, 4, 1, 3, 5]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 13)",
        "expected": "[6, 4, 5, 2, 1, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 14)",
        "expected": "[4, 5, 1, 2, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 15)",
        "expected": "[5, 1, 6, 4, 2, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 16)",
        "expected": "[1, 6, 2, 4, 3, 5]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 17)",
        "expected": "[6, 2, 5, 1, 4, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 18)",
        "expected": "[2, 5, 4, 1, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 19)",
        "expected": "[5, 4, 6, 2, 1, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 20)",
        "expected": "[4, 6, 1, 2, 3, 5]"
      }
    ]
  },
  {
    "id": "newton_q41",
    "title": "41. Sum and Max of Matrix - using recursion",
    "difficulty": "Easy",
    "topic": "Arrays",
    "description": "Sum and Max of Matrix - using recursion\nEasy\nxp icon\n0/20\nTime Limit: 2, Memory Limit: 256000\nYou are given a 2D matrix mat consisting of n rows and m columns. Your task is to:\nCalculate and print the sum of all the elements in the matrix.\nFind and print the maximum element present in the matrix.\nInput\nThe first line of input contains two space-separated integers representing the values n and m respectively.\nEach of the next n line contains m space-separated integers, where the i-th line represents the i-th row.\nOutput\nPrint two integers, each on a separate line:\nThe first line should contain the sum of all elements in the matrix.\nThe second line should contain the maximum element in the matrix.\nConstraints\n1\n≤\nn\n,\nm\n≤\n100\n1≤n,m≤100\n1\n≤\nm\na\nt\n[\ni\n]\n[\nj\n]\n≤\n100\n1≤mat[i][j]≤100\nExample\nInput\n3 2\n1 2\n3 4\n5 6\nOutput\n21\n6\nExplanation\nThe sum of all the elements in the matrix is 21, and 6 is the largest element present in the matrix.\n\nInput\n3 4\n9 9 9 9\n9 9 9 9\n9 9 9 9\nOutput\n108\n9\nExplanation\nThe sum of all the elements in the matrix is 108, and 9 is the largest element present in the matrix.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildTree([1, 2, 3]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3]), 2",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, 3]), 3",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), 4",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), -1",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), 5",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 0",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 1",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 2",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 3",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 4",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), -1",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, null, null, 3]), 5",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 0",
        "expected": "15"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 1",
        "expected": "5"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 2",
        "expected": "4"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 3",
        "expected": "3"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 4",
        "expected": "2"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 5",
        "expected": "1"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), 6",
        "expected": "0"
      },
      {
        "input": "buildTree([1, 2, 3, 4, 5]), -1",
        "expected": "0"
      }
    ]
  },
  {
    "id": "newton_q42",
    "title": "42. Paths to the Control Room",
    "difficulty": "Medium",
    "topic": "Algorithms",
    "description": "Paths to the Control Room\nMedium\nYou are given a grid representing a building. Starting from the entrance, find all possible paths to the control room by moving through valid cells.\n\nInput\nThe first line contains the dimensions of the grid followed by the grid values.\n\nOutput\nReturn or print all valid paths from the source to the destination.\n\nA path may move only through allowed cells and must not revisit a cell.\n\nExample\nFor a grid with a clear route from the source to the control room, output the sequence of moves for every valid route.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2)",
        "expected": "[[0,0],[0,1],[0,2],[1,2],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 1)",
        "expected": "[[0,0],[0,1],[1,1]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 1, 2)",
        "expected": "[[0,0],[0,1],[0,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 3, 3)",
        "expected": "[[0,0],[0,1],[0,2],[1,2],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 0, 0)",
        "expected": "[[0,0]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 1, 1)",
        "expected": "[[0,0],[0,1]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 0)",
        "expected": "[[0,0],[1,0],[2,0]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 0, 1)",
        "expected": "[[0,0],[0,1]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 3, 3, [[0,1],[1,1],[2,1],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 1, 1, [[0,0],[0,1]])",
        "expected": "[[0,0],[0,1]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2],[2,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2],[2,2],[2,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2],[2,2],[2,2],[2,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,0,0],[0,0,0]], 0, 0, 2, 2, [[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[2,1],[2,2],[1,2],[2,2],[2,2],[2,2],[2,2],[2,2],[2,2]])",
        "expected": "[[0,0],[0,1],[1,1],[2,1],[2,2]]"
      }
    ]
  },
  {
    "id": "newton_q43",
    "title": "43. Paths to the Control Room with Obstacles",
    "difficulty": "Medium",
    "topic": "Algorithms",
    "description": "Paths to the Control Room with Obstacles\nMedium\nYou are given a grid with obstacles, a source cell, and a control-room destination. Find all paths from the source to the destination while avoiding obstacles.\n\nInput\nThe first line contains the grid dimensions followed by the grid, where blocked cells cannot be visited.\n\nOutput\nReturn or print every valid path. If no path exists, return an empty result.\n\nA path must stay inside the grid and must not revisit a cell.",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,2]",
        "expected": "[[[0,0],[0,1],[2,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,1]",
        "expected": "[]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,0]",
        "expected": "[[[0,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,2]",
        "expected": "[[[0,0],[0,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,0]",
        "expected": "[[[0,0],[1,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,1]",
        "expected": "[[[0,0],[0,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,1]",
        "expected": "[[[0,0],[1,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,0]",
        "expected": "[[[0,0],[2,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,0,0]",
        "expected": "[[[0,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,0,1]",
        "expected": "[[[0,0],[0,0,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,0,2]",
        "expected": "[[[0,0],[0,0,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,1,0]",
        "expected": "[[[0,0],[0,1,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,1,1]",
        "expected": "[[[0,0],[0,1,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [0,1,2]",
        "expected": "[[[0,0],[0,1,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,0,0]",
        "expected": "[[[0,0],[1,0,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,0,1]",
        "expected": "[[[0,0],[1,0,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,0,2]",
        "expected": "[[[0,0],[1,0,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,1,0]",
        "expected": "[[[0,0],[1,1,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,1,1]",
        "expected": "[[[0,0],[1,1,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [1,1,2]",
        "expected": "[[[0,0],[1,1,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,0,0]",
        "expected": "[[[0,0],[2,0,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,0,1]",
        "expected": "[[[0,0],[2,0,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,0,2]",
        "expected": "[[[0,0],[2,0,2]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,1,0]",
        "expected": "[[[0,0],[2,1,0]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,1,1]",
        "expected": "[[[0,0],[2,1,1]]]"
      },
      {
        "input": "buildGrid([[0,0,0],[0,1,0],[0,0,0]]), [0,0], [2,1,2]",
        "expected": "[[[0,0],[2,1,2]]]"
      }
    ]
  },
  {
    "id": "newton_q44",
    "title": "44. Row Wise Matrix Traversal",
    "difficulty": "Medium",
    "topic": "Arrays",
    "description": "Row Wise Matrix Traversal\nMedium\nGiven a matrix with n rows and m columns, traverse its elements row by row from left to right, starting at the first row.\n\nInput\nThe first line contains n and m. The next n lines contain the matrix elements.\n\nOutput\nPrint or return the elements in row-wise order.\n\nExample\nInput\n2 3\n1 2 3\n4 5 6\nOutput\n1 2 3 4 5 6",
    "examples": [],
    "constraints": [],
    "starterCode": {
      "typescript": "function solve(root: any, X: any): any {\n  // Your logic here\n  return -1;\n}",
      "javascript": "function solve(root, X) {\n  // Your logic here\n  return -1;\n}",
      "python": "def solve(root, X):\n    # Your logic here\n    return -1"
    },
    "testCases": [
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0)",
        "expected": "[1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0)",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 1)",
        "expected": "[4, 5, 6, 1, 2, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 1)",
        "expected": "[7, 8, 9, 1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], -1)",
        "expected": "[]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], -1)",
        "expected": "[]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 2)",
        "expected": "[1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 2)",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 1)",
        "expected": "[1, 4, 2, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 1)",
        "expected": "[1, 4, 7, 2, 5, 8, 3, 6, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 2)",
        "expected": "[1, 2, 4, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 2)",
        "expected": "[1, 2, 4, 5, 7, 8, 3, 6, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 0)",
        "expected": "[1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0)",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 1, 0)",
        "expected": "[4, 5, 6, 1, 2, 3]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 1, 0)",
        "expected": "[7, 8, 9, 1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 1, 1)",
        "expected": "[1, 4, 2, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 1, 1)",
        "expected": "[1, 4, 7, 2, 5, 8, 3, 6, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 2, 1)",
        "expected": "[1, 2, 4, 5, 3, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 2, 1)",
        "expected": "[1, 2, 4, 5, 7, 8, 3, 6, 9]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6]], 0, 0, 1)",
        "expected": "[1, 2, 3, 4, 5, 6]"
      },
      {
        "input": "buildMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0, 1)",
        "expected": "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
      }
    ]
  }
];
