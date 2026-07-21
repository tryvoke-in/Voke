export type DSAQuestion = {
    id: number;
    topic: string;
    title: string;
    companies: string[];
    remarks: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    platform: string;
    url: string;
};

export const DSA_QUESTIONS: DSAQuestion[] = [
    {
        "id": 1,
        "topic": "Arrays",
        "title": "Maximum and Minimum Element in an Array",
        "companies": [
            "ABCO",
            "Accolite",
            "Amazon",
            "Cisco",
            "Hike",
            "Microsoft",
            "Snapdeal",
            "VMWare",
            "Google",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-and-minimum-element-in-an-array/"
    },
    {
        "id": 2,
        "topic": "Arrays",
        "title": "Reverse the Array",
        "companies": [
            "Infosys",
            "Moonfrog",
            "Labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reverse-the-array/"
    },
    {
        "id": 3,
        "topic": "Arrays",
        "title": "Maximum-Subarray",
        "companies": [
            "Microsoft",
            "Facebook",
            "Interview",
            "Qs"
        ],
        "remarks": "use Kadane's Algorithm",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-subarray/"
    },
    {
        "id": 4,
        "topic": "Arrays",
        "title": "Contains Duplicate",
        "companies": [
            "Amazon",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/contains-duplicate/"
    },
    {
        "id": 5,
        "topic": "Arrays",
        "title": "Chocolate Distribution Problem",
        "companies": [
            "Amazon",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/chocolate-distribution-problem/"
    },
    {
        "id": 6,
        "topic": "Arrays",
        "title": "Search in Rotated Sorted Array",
        "companies": [
            "Microsoft",
            "Google",
            "Adobe",
            "Amazon",
            "D-E-Shaw",
            "Flipkart",
            "Hike",
            "Intuit",
            "MakeMyTrip",
            "Paytm"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/"
    },
    {
        "id": 7,
        "topic": "Arrays",
        "title": "Next Permutation",
        "companies": [
            "Uber",
            "Goldman",
            "Sachs",
            "Adobe",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/next-permutation/"
    },
    {
        "id": 8,
        "topic": "Arrays",
        "title": "Best time to Buy and Sell Stock",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Directi",
            "Flipkart",
            "Goldman",
            "Sachs",
            "Intuit",
            "MakeMyTrip",
            "Microsoft",
            "Ola",
            "Cabs",
            "Oracle",
            "Paytm",
            "Pubmatic",
            "Quikr",
            "Salesforce",
            "Sapient",
            "Swiggy",
            "Walmart",
            "Media.net",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"
    },
    {
        "id": 9,
        "topic": "Arrays",
        "title": "Repeat and Missing Number Array",
        "companies": [
            "Amazon",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/repeat-and-missing-number-array/"
    },
    {
        "id": 10,
        "topic": "Arrays",
        "title": "Kth-Largest Element in an Array",
        "companies": [
            "Amazon",
            "Microsoft",
            "Walmart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kth-largest-element-in-an-array/"
    },
    {
        "id": 11,
        "topic": "Arrays",
        "title": "Trapping Rain Water",
        "companies": [
            "Samsung",
            "Interview",
            "Qs"
        ],
        "remarks": "use auxiliary arrays",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/trapping-rain-water/"
    },
    {
        "id": 12,
        "topic": "Arrays",
        "title": "Product of Array Except Self",
        "companies": [
            "Microsoft",
            "Facebook",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/product-of-array-except-self/"
    },
    {
        "id": 13,
        "topic": "Arrays",
        "title": "Maximum Product Subarray",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Microsoft",
            "Morgan",
            "Stanley",
            "OYO",
            "Rooms",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-product-subarray/"
    },
    {
        "id": 14,
        "topic": "Arrays",
        "title": "Find Minimum in Rotated Sorted Array",
        "companies": [
            "Adobe",
            "Amazon",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Samsung",
            "Snapdeal",
            "Times",
            "Internet"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/"
    },
    {
        "id": 15,
        "topic": "Arrays",
        "title": "Find Pair with Sum in Sorted & Rotated Array",
        "companies": [
            "Microsoft",
            "Google",
            "Apple",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-pair-with-sum-in-sorted-rotated-array/"
    },
    {
        "id": 16,
        "topic": "Arrays",
        "title": "3Sum",
        "companies": [
            "Adobe",
            "Amazon",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Samsung",
            "Snapdeal",
            "Times",
            "Internet"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/3sum/"
    },
    {
        "id": 17,
        "topic": "Arrays",
        "title": "Container With Most Water",
        "companies": [
            "Flipkart",
            "Dunzo",
            "Interview",
            "Qs"
        ],
        "remarks": "use 2 pointer approach",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/container-with-most-water/"
    },
    {
        "id": 18,
        "topic": "Arrays",
        "title": "Given Sum Pair",
        "companies": [
            "Infosys",
            "Amazon",
            "Flipkart",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/given-sum-pair/"
    },
    {
        "id": 19,
        "topic": "Arrays",
        "title": "Kth - Smallest Element",
        "companies": [
            "ABCO",
            "Accolite",
            "Amazon",
            "Cisco",
            "Hike",
            "Microsoft",
            "Snapdeal",
            "VMWare",
            "Google",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kth-smallest-element/"
    },
    {
        "id": 20,
        "topic": "Arrays",
        "title": "Merge Overlapping Intervals",
        "companies": [
            "Google",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-overlapping-intervals/"
    },
    {
        "id": 21,
        "topic": "Arrays",
        "title": "Find Minimum Number of Merge Operations to Make an Array Palindrome",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-minimum-number-of-merge-operations-to-make-an-array-palindrome/"
    },
    {
        "id": 22,
        "topic": "Arrays",
        "title": "Given an Array of Numbers Arrange the Numbers to Form the Biggest Number",
        "companies": [
            "Barclays",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/given-an-array-of-numbers-arrange-the-numbers-to-form-the-biggest-number/"
    },
    {
        "id": 23,
        "topic": "Arrays",
        "title": "Space Optimization Using Bit Manipulations",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/space-optimization-using-bit-manipulations/"
    },
    {
        "id": 24,
        "topic": "Arrays",
        "title": "Subarray Sum Divisible K",
        "companies": [
            "Snapdeal",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/subarray-sum-divisible-k/"
    },
    {
        "id": 25,
        "topic": "Arrays",
        "title": "Print all Possible Combinations of r Elements in a Given Array of Size n",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-all-possible-combinations-of-r-elements-in-a-given-array-of-size-n/"
    },
    {
        "id": 26,
        "topic": "Arrays",
        "title": "Mo's Algorithm",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/mo-s-algorithm/"
    },
    {
        "id": 27,
        "topic": "Strings",
        "title": "Valid Palindrome",
        "companies": [
            "Amazon",
            "Cisco",
            "D-E-Shaw",
            "Facebook",
            "FactSet",
            "Morgan",
            "Stanley",
            "Paytm",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/valid-palindrome/"
    },
    {
        "id": 28,
        "topic": "Strings",
        "title": "Valid Anagram",
        "companies": [
            "Nagarro",
            "Media.net",
            "Directi",
            "Google",
            "Adobe",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/valid-anagram/"
    },
    {
        "id": 29,
        "topic": "Strings",
        "title": "Valid parentheses",
        "companies": [
            "Google",
            "Interview",
            "Qs"
        ],
        "remarks": "use Stacks (if possible)",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/valid-parentheses/"
    },
    {
        "id": 30,
        "topic": "Strings",
        "title": "Remove Consecutive Characters",
        "companies": [
            "Samsung",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/remove-consecutive-characters/"
    },
    {
        "id": 31,
        "topic": "Strings",
        "title": "Longest Common Prefix",
        "companies": [
            "Adobe",
            "Grofers",
            "Dunzo",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-common-prefix/"
    },
    {
        "id": 32,
        "topic": "Strings",
        "title": "Convert a Sentence into its Equivalent Mobile Numeric Keypad Sequence",
        "companies": [
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/convert-a-sentence-into-its-equivalent-mobile-numeric-keypad-sequence/"
    },
    {
        "id": 33,
        "topic": "Strings",
        "title": "Print all the Duplicates in the Input String",
        "companies": [
            "Ola",
            "Amdocs",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-all-the-duplicates-in-the-input-string/"
    },
    {
        "id": 34,
        "topic": "Strings",
        "title": "Longest Substring without Repeating Characters",
        "companies": [
            "Morgan",
            "Stanley",
            "Amazon",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
    },
    {
        "id": 35,
        "topic": "Strings",
        "title": "Longest Repeating Character Replacement",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-repeating-character-replacement/"
    },
    {
        "id": 36,
        "topic": "Strings",
        "title": "Group Anagrams",
        "companies": [
            "Samsung",
            "Adobe",
            "Amazon",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/group-anagrams/"
    },
    {
        "id": 37,
        "topic": "Strings",
        "title": "Longest Palindromic Substring",
        "companies": [
            "Microsoft",
            "Google",
            "Samsung",
            "Visa",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-palindromic-substring/"
    },
    {
        "id": 38,
        "topic": "Strings",
        "title": "Palindromic Substrings",
        "companies": [
            "Microsoft",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/palindromic-substrings/"
    },
    {
        "id": 39,
        "topic": "Strings",
        "title": "Next Permutation",
        "companies": [
            "Adobe",
            "Goldman",
            "Sachs",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/next-permutation/"
    },
    {
        "id": 40,
        "topic": "Strings",
        "title": "Count Palindromic Subsequences",
        "companies": [
            "Myntra",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-palindromic-subsequences/"
    },
    {
        "id": 41,
        "topic": "Strings",
        "title": "Smallest Window in a String Containing all the Characters of Another String",
        "companies": [
            "Microsoft",
            "Amazon",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string/"
    },
    {
        "id": 42,
        "topic": "Strings",
        "title": "Wildcard String Matching",
        "companies": [
            "Microsoft",
            "Amazon",
            "Ola",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/wildcard-string-matching/"
    },
    {
        "id": 43,
        "topic": "Strings",
        "title": "Longest Prefix Suffix",
        "companies": [
            "Flipkart",
            "Swiggy",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-prefix-suffix/"
    },
    {
        "id": 44,
        "topic": "Strings",
        "title": "Rabin-Karp Algorithm for Pattern Searching",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rabin-karp-algorithm-for-pattern-searching/"
    },
    {
        "id": 45,
        "topic": "Strings",
        "title": "Transform One String to Another using Minimum Number of Given Operation",
        "companies": [
            "Directi"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/transform-one-string-to-another-using-minimum-number-of-given-operation/"
    },
    {
        "id": 46,
        "topic": "Strings",
        "title": "Minimum Window Substring",
        "companies": [
            "Amazon",
            "Google",
            "MakeMyTrip",
            "Streamoid",
            "Technologies",
            "Microsoft",
            "Media.net",
            "Atlassian",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-window-substring/"
    },
    {
        "id": 47,
        "topic": "Strings",
        "title": "Boyer Moore Algorithm for Pattern Searching",
        "companies": [
            "Amdocs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/boyer-moore-algorithm-for-pattern-searching/"
    },
    {
        "id": 48,
        "topic": "Strings",
        "title": "Word Wrap",
        "companies": [
            "Microsoft"
        ],
        "remarks": "use Dynaming Programming",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-wrap/"
    },
    {
        "id": 49,
        "topic": "2D Arrays",
        "title": "Zigzag (or diagonal) Traversal of Matrix",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/zigzag-or-diagonal-traversal-of-matrix/"
    },
    {
        "id": 50,
        "topic": "2D Arrays",
        "title": "Set Matrix Zeroes",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/set-matrix-zeroes/"
    },
    {
        "id": 51,
        "topic": "2D Arrays",
        "title": "Spiral Matrix",
        "companies": [
            "Flipkart",
            "Apple",
            "Societe",
            "Generale",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/spiral-matrix/"
    },
    {
        "id": 52,
        "topic": "2D Arrays",
        "title": "Rotate Image",
        "companies": [
            "Microsoft",
            "Paytm",
            "Samsung",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rotate-image/"
    },
    {
        "id": 53,
        "topic": "2D Arrays",
        "title": "Word Search",
        "companies": [
            "Google",
            "Ola",
            "Goldman",
            "Sachs",
            "IQ"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-search/"
    },
    {
        "id": 54,
        "topic": "2D Arrays",
        "title": "Find the Number of Islands | Set 1 (Using DFS)",
        "companies": [
            "Microsoft",
            "Uber",
            "Apple",
            "Amazon",
            "IQ"
        ],
        "remarks": "Read about DFS",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-number-of-islands-set-1-using-dfs-/"
    },
    {
        "id": 55,
        "topic": "2D Arrays",
        "title": "Given a Matrix of ‘O’ and ‘X’, Replace ‘O’ with ‘X’ if Surrounded by ‘X’",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/given-a-matrix-of-o-and-x-replace-o-with-x-if-surrounded-by-x-/"
    },
    {
        "id": 56,
        "topic": "2D Arrays",
        "title": "Find a Common Element in all Rows of a Given Row-Wise Sorted Matrix",
        "companies": [
            "MAQ",
            "Software",
            "Microsoft",
            "VMWare"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-a-common-element-in-all-rows-of-a-given-row-wise-sorted-matrix/"
    },
    {
        "id": 57,
        "topic": "2D Arrays",
        "title": "Create a Matrix with Alternating Rectangles of O and X",
        "companies": [
            "MAQ",
            "VMWare"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/create-a-matrix-with-alternating-rectangles-of-o-and-x/"
    },
    {
        "id": 58,
        "topic": "2D Arrays",
        "title": "Maximum Size Rectangle of all 1s",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-size-rectangle-of-all-1s/"
    },
    {
        "id": 59,
        "topic": "Searching & Sorting",
        "title": "Permute Two Arrays such that Sum of Every Pair is Greater or Equal to K",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/permute-two-arrays-such-that-sum-of-every-pair-is-greater-or-equal-to-k/"
    },
    {
        "id": 60,
        "topic": "Searching & Sorting",
        "title": "counting sort",
        "companies": [
            "Samsung+",
            "Morgan",
            "Stanley+",
            "Snapdeal",
            "EPAM",
            "Systems"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/counting-sort/"
    },
    {
        "id": 61,
        "topic": "Searching & Sorting",
        "title": "find common elements three sorted arrays",
        "companies": [
            "MAQ",
            "Software",
            "Microsoft",
            "VMWare"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-common-elements-three-sorted-arrays/"
    },
    {
        "id": 62,
        "topic": "Searching & Sorting",
        "title": "Searching in an array where adjacent differ by at most k",
        "companies": [
            "TCS",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/searching-in-an-array-where-adjacent-differ-by-at-most-k/"
    },
    {
        "id": 63,
        "topic": "Searching & Sorting",
        "title": "ceiling in a sorted array",
        "companies": [
            "TCS"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/ceiling-in-a-sorted-array/"
    },
    {
        "id": 64,
        "topic": "Searching & Sorting",
        "title": "Piar with given difference",
        "companies": [
            "Amazon",
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/piar-with-given-difference/"
    },
    {
        "id": 65,
        "topic": "Searching & Sorting",
        "title": "majority element",
        "companies": [
            "Amazon+",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/majority-element/"
    },
    {
        "id": 66,
        "topic": "Searching & Sorting",
        "title": "count triplets with sum smaller that a given value",
        "companies": [
            "Amazon",
            "SAP",
            "Labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-triplets-with-sum-smaller-that-a-given-value/"
    },
    {
        "id": 67,
        "topic": "Searching & Sorting",
        "title": "Maximum Sum Subsequence with no adjacent elements",
        "companies": [
            "Amazon",
            "FactSet",
            "Oxigen",
            "Wallet",
            "OYO",
            "Rooms",
            "Paytm",
            "Walmart",
            "Yahoo",
            "Adobe",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-sum-subsequence-with-no-adjacent-elements/"
    },
    {
        "id": 68,
        "topic": "Searching & Sorting",
        "title": "Merge Sorted Arrays using O(1) Space",
        "companies": [
            "Amdocs",
            "Brocade",
            "Goldman",
            "Sachs",
            "Juniper",
            "Networks",
            "Linkedin",
            "Microsoft",
            "Quikr",
            "Snapdeal",
            "Synopsys",
            "Zoho",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-sorted-arrays-using-o-1-space/"
    },
    {
        "id": 69,
        "topic": "Searching & Sorting",
        "title": "Inversion of Array",
        "companies": [
            "Adobe",
            "Amazon",
            "BankBazaar",
            "Flipkart",
            "Microsoft",
            "Myntra",
            "MakeMyTrip"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/inversion-of-array/"
    },
    {
        "id": 70,
        "topic": "Searching & Sorting",
        "title": "Find Duplicates in O(n) Time and O(1) Extra Space",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Flipkart",
            "Paytm",
            "Qualcomm",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-duplicates-in-o-n-time-and-o-1-extra-space/"
    },
    {
        "id": 71,
        "topic": "Searching & Sorting",
        "title": "Radix Sort",
        "companies": [
            "Amazon+",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/radix-sort/"
    },
    {
        "id": 72,
        "topic": "Searching & Sorting",
        "title": "Product of Array except itself",
        "companies": [
            "Accolite",
            "Amazon",
            "D-E-Shaw",
            "Intuit",
            "Morgan",
            "Stanley",
            "Opera",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/product-of-array-except-itself/"
    },
    {
        "id": 73,
        "topic": "Searching & Sorting",
        "title": "Make all Array Elements Equal",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/make-all-array-elements-equal/"
    },
    {
        "id": 74,
        "topic": "Searching & Sorting",
        "title": "Check if Reversing a Sub Array Make the Array Sorted",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-if-reversing-a-sub-array-make-the-array-sorted/"
    },
    {
        "id": 75,
        "topic": "Searching & Sorting",
        "title": "Find Four Elements that Sum to a Given Value",
        "companies": [
            "Adobe",
            "Amazon",
            "Google",
            "Microsoft",
            "OYO",
            "Rooms"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-four-elements-that-sum-to-a-given-value/"
    },
    {
        "id": 76,
        "topic": "Searching & Sorting",
        "title": "Median of Two Sorted Array with Different Size",
        "companies": [
            "Amazon",
            "Samsung",
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/median-of-two-sorted-array-with-different-size/"
    },
    {
        "id": 77,
        "topic": "Searching & Sorting",
        "title": "Median of Stream of Integers Running Integers",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/median-of-stream-of-integers-running-integers/"
    },
    {
        "id": 78,
        "topic": "Searching & Sorting",
        "title": "Print Subarrays with 0 Sum",
        "companies": [
            "Paytm",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-subarrays-with-0-sum/"
    },
    {
        "id": 79,
        "topic": "Searching & Sorting",
        "title": "Aggressive Cows",
        "companies": [
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/aggressive-cows/"
    },
    {
        "id": 80,
        "topic": "Searching & Sorting",
        "title": "Allocate Minimum number of Pages",
        "companies": [
            "Google",
            "Infosys",
            "Codenation",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/allocate-minimum-number-of-pages/"
    },
    {
        "id": 81,
        "topic": "Searching & Sorting",
        "title": "Minimum Swaps to Sort",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-swaps-to-sort/"
    },
    {
        "id": 82,
        "topic": "Backtracking",
        "title": "Backtracking Set 2 Rat in a Maze",
        "companies": [
            "Microsoft",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/backtracking-set-2-rat-in-a-maze/"
    },
    {
        "id": 83,
        "topic": "Backtracking",
        "title": "Combinational Sum",
        "companies": [
            "Adobe",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/combinational-sum/"
    },
    {
        "id": 84,
        "topic": "Backtracking",
        "title": "Crossword-Puzzle",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/crossword-puzzle/"
    },
    {
        "id": 85,
        "topic": "Backtracking",
        "title": "Longest Possible Route in a Matrix with Hurdles",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-possible-route-in-a-matrix-with-hurdles/"
    },
    {
        "id": 86,
        "topic": "Backtracking",
        "title": "Printing all solutions in N-Queen Problem",
        "companies": [
            "Accolite",
            "Amazon",
            "Amdocs",
            "D-E-Shaw",
            "MAQ",
            "Software",
            "Twitter",
            "Visa",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/printing-all-solutions-in-n-queen-problem/"
    },
    {
        "id": 87,
        "topic": "Backtracking",
        "title": "Solve the Sudoku",
        "companies": [
            "Amazon",
            "Directi",
            "Flipkart",
            "MakeMyTrip",
            "MAQ",
            "Software",
            "Microsoft",
            "Ola",
            "Cabs",
            "Oracle",
            "PayPal",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/solve-the-sudoku/"
    },
    {
        "id": 88,
        "topic": "Backtracking",
        "title": "Partition Equal Subset Sum",
        "companies": [
            "Amazon",
            "Adobe",
            "Accolite",
            "Traveloka"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/partition-equal-subset-sum/"
    },
    {
        "id": 89,
        "topic": "Backtracking",
        "title": "M Coloring Problem",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/m-coloring-problem/"
    },
    {
        "id": 90,
        "topic": "Backtracking",
        "title": "Knight Tour",
        "companies": [
            "IBM"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/knight-tour/"
    },
    {
        "id": 91,
        "topic": "Backtracking",
        "title": "Soduko",
        "companies": [
            "Amazon",
            "Adobe",
            "Accolite",
            "Traveloka"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/soduko/"
    },
    {
        "id": 92,
        "topic": "Backtracking",
        "title": "Remove Invalid Parentheses",
        "companies": [
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/remove-invalid-parentheses/"
    },
    {
        "id": 93,
        "topic": "Backtracking",
        "title": "Word Break Problem using Backtracking",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-break-problem-using-backtracking/"
    },
    {
        "id": 94,
        "topic": "Backtracking",
        "title": "Print all Palindromic Partitions of a String",
        "companies": [
            "Facebook",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-all-palindromic-partitions-of-a-string/"
    },
    {
        "id": 95,
        "topic": "Backtracking",
        "title": "Find Shortest Safe Route in a Path with Landmines",
        "companies": [
            "Facebook",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-shortest-safe-route-in-a-path-with-landmines/"
    },
    {
        "id": 96,
        "topic": "Backtracking",
        "title": "Partition of Set into K Subsets with Equal Sum",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/partition-of-set-into-k-subsets-with-equal-sum/"
    },
    {
        "id": 97,
        "topic": "Backtracking",
        "title": "Backtracking set-7 hamiltonian cycle",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/backtracking-set-7-hamiltonian-cycle/"
    },
    {
        "id": 98,
        "topic": "Backtracking",
        "title": "tug-of-war",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/tug-of-war/"
    },
    {
        "id": 99,
        "topic": "Backtracking",
        "title": "Maximum Possible Number by doing at most K swaps",
        "companies": [
            "Amazon",
            "Adobe",
            "Accolite",
            "Traveloka"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-possible-number-by-doing-at-most-k-swaps/"
    },
    {
        "id": 100,
        "topic": "Backtracking",
        "title": "Backtracking set-8 solving cryptarithmetic puzzles",
        "companies": [
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/backtracking-set-8-solving-cryptarithmetic-puzzles/"
    },
    {
        "id": 101,
        "topic": "Backtracking",
        "title": "Find paths from corner cell to middle cell in maze",
        "companies": [
            "Meta"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-paths-from-corner-cell-to-middle-cell-in-maze/"
    },
    {
        "id": 102,
        "topic": "Backtracking",
        "title": "Arithmetic Expressions",
        "companies": [
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/arithmetic-expressions/"
    },
    {
        "id": 103,
        "topic": "Linked List",
        "title": "Reverse Linked List",
        "companies": [
            "Sprinklr"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reverse-linked-list/"
    },
    {
        "id": 104,
        "topic": "Linked List",
        "title": "Linked List Cycle",
        "companies": [
            "Accolite",
            "Amazon",
            "D-E-Shaw",
            "Hike",
            "Lybrate",
            "Mahindra",
            "Comviva",
            "MakeMyTrip",
            "MAQ",
            "Software",
            "OYO",
            "Rooms",
            "Paytm",
            "Qualcomm",
            "Samsung",
            "SAP",
            "Labs",
            "Snapdeal",
            "Veritas",
            "VMWare",
            "Walmart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/linked-list-cycle/"
    },
    {
        "id": 105,
        "topic": "Linked List",
        "title": "Merge Two Sorted Lists",
        "companies": [
            "Accolite",
            "Amazon",
            "Belzabar",
            "Brocade",
            "FactSet",
            "Flipkart",
            "MakeMyTrip",
            "Microsoft",
            "OATS",
            "Systems",
            "Oracle",
            "Samsung",
            "Synopsys",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-two-sorted-lists/"
    },
    {
        "id": 106,
        "topic": "Linked List",
        "title": "Delete without Head node",
        "companies": [
            "Amazon",
            "Goldman",
            "Sachs",
            "Kritikal",
            "Solutions",
            "Microsoft",
            "Samsung",
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/delete-without-head-node/"
    },
    {
        "id": 107,
        "topic": "Linked List",
        "title": "Remove duplicates from an unsorted linked list",
        "companies": [
            "Amazon Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/remove-duplicates-from-an-unsorted-linked-list/"
    },
    {
        "id": 108,
        "topic": "Linked List",
        "title": "Sort a linked list of 0s-1s-or-2s",
        "companies": [
            "Microsoft",
            "Amazon",
            "MakeMyTrip"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/sort-a-linked-list-of-0s-1s-or-2s/"
    },
    {
        "id": 109,
        "topic": "Linked List",
        "title": "Multiply two numbers represented linked lists",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/multiply-two-numbers-represented-linked-lists/"
    },
    {
        "id": 110,
        "topic": "Linked List",
        "title": "Remove nth node from end of list",
        "companies": [
            "Accolite",
            "Adobe",
            "Amazon",
            "Citicorp",
            "Epic",
            "Systems",
            "FactSet",
            "Hike",
            "MAQ",
            "Software",
            "Monotype",
            "Solutions",
            "Morgan",
            "Stanley",
            "OYO",
            "Rooms",
            "Qualcomm",
            "Samsung",
            "Snapdeal",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"
    },
    {
        "id": 111,
        "topic": "Linked List",
        "title": "Reorder List",
        "companies": [
            "Amazon",
            "Microsoft",
            "OYO",
            "Rooms",
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reorder-list/"
    },
    {
        "id": 112,
        "topic": "Linked List",
        "title": "Detect and remove loop in a linked list",
        "companies": [
            "Accolite",
            "Amazon",
            "D-E-Shaw",
            "Hike",
            "Lybrate",
            "Mahindra",
            "Comviva",
            "MakeMyTrip",
            "MAQ",
            "Software",
            "OYO",
            "Rooms",
            "Paytm",
            "Qualcomm",
            "Samsung",
            "SAP",
            "Labs",
            "Snapdeal",
            "Veritas",
            "VMWare",
            "Walmart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/detect-and-remove-loop-in-a-linked-list/"
    },
    {
        "id": 113,
        "topic": "Linked List",
        "title": "Write a Function to get the Intersection Point of two Linked Lists",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/write-a-function-to-get-the-intersection-point-of-two-linked-lists/"
    },
    {
        "id": 114,
        "topic": "Linked List",
        "title": "Flatten a linked list with next and child pointers",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/flatten-a-linked-list-with-next-and-child-pointers/"
    },
    {
        "id": 115,
        "topic": "Linked List",
        "title": "Linked list in zig-zag fashion",
        "companies": [
            "Micorsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/linked-list-in-zig-zag-fashion/"
    },
    {
        "id": 116,
        "topic": "Linked List",
        "title": "Reverse a doubly linked list",
        "companies": [
            "Walmart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reverse-a-doubly-linked-list/"
    },
    {
        "id": 117,
        "topic": "Linked List",
        "title": "Delete nodes which have a greater value on right side",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/delete-nodes-which-have-a-greater-value-on-right-side/"
    },
    {
        "id": 118,
        "topic": "Linked List",
        "title": "Segregate even and odd Elements in a Linked List",
        "companies": [
            "Walmart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/segregate-even-and-odd-elements-in-a-linked-list/"
    },
    {
        "id": 119,
        "topic": "Linked List",
        "title": "Point to next higher value node in a linked list with an Arbitrary Pointer",
        "companies": [
            "GeekyAnts"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/point-to-next-higher-value-node-in-a-linked-list-with-an-arbitrary-pointer/"
    },
    {
        "id": 120,
        "topic": "Linked List",
        "title": "Rearrange a given linked list in place",
        "companies": [
            "Ola",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rearrange-a-given-linked-list-in-place/"
    },
    {
        "id": 121,
        "topic": "Linked List",
        "title": "Sort Biotonic Doubly Linked Lists",
        "companies": [
            "Morgan",
            "Stanley"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/sort-biotonic-doubly-linked-lists/"
    },
    {
        "id": 122,
        "topic": "Linked List",
        "title": "Merge K Sorted Lists",
        "companies": [
            "Microsoft+",
            "Ola+",
            "eBay"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-k-sorted-lists/"
    },
    {
        "id": 123,
        "topic": "Linked List",
        "title": "Merge sort for linked list",
        "companies": [
            "Accolite",
            "Adobe",
            "Amazon",
            "MAQ",
            "Software",
            "Microsoft",
            "Paytm",
            "Veritas"
        ],
        "remarks": "Important",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-sort-for-linked-list/"
    },
    {
        "id": 124,
        "topic": "Linked List",
        "title": "Quicksort on singly-linked list",
        "companies": [
            "Paytm"
        ],
        "remarks": "Important",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/quicksort-on-singly-linked-list/"
    },
    {
        "id": 125,
        "topic": "Linked List",
        "title": "Sum of two linked lists",
        "companies": [
            "Accolite",
            "Amazon",
            "Flipkart",
            "MakeMyTrip",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Qualcomm",
            "Snapdeal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/sum-of-two-linked-lists/"
    },
    {
        "id": 126,
        "topic": "Linked List",
        "title": "Flattening a linked list",
        "companies": [
            "24*7",
            "Innovation",
            "Labs Amazon Drishti-Soft Flipkart Goldman",
            "Sachs Microsoft Paytm Payu Qualcomm Snapdeal Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/flattening-a-linked-list/"
    },
    {
        "id": 127,
        "topic": "Linked List",
        "title": "Clone a linked list with next and random Pointer",
        "companies": [
            "Triology"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/clone-a-linked-list-with-next-and-random-pointer/"
    },
    {
        "id": 128,
        "topic": "Linked List",
        "title": "Subtract two numbers represented as linked lists",
        "companies": [
            "Amazon",
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/subtract-two-numbers-represented-as-linked-lists/"
    },
    {
        "id": 129,
        "topic": "Stacks & Queues",
        "title": "Implement two stacks in an Array",
        "companies": [
            "24*7",
            "Innovation",
            "Labs",
            "Microsoft",
            "Samsung",
            "Snapdeal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/implement-two-stacks-in-an-array/"
    },
    {
        "id": 130,
        "topic": "Stacks & Queues",
        "title": "Evaluation of Postfix Expression",
        "companies": [
            "Amazon",
            "Google",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/evaluation-of-postfix-expression/"
    },
    {
        "id": 131,
        "topic": "Stacks & Queues",
        "title": "Implement Stack using Queues",
        "companies": [
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/implement-stack-using-queues/"
    },
    {
        "id": 132,
        "topic": "Stacks & Queues",
        "title": "Queue Reversal",
        "companies": [
            "Amazon",
            "Morgain",
            "Stanley"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/queue-reversal/"
    },
    {
        "id": 133,
        "topic": "Stacks & Queues",
        "title": "Implement Stack Queue using Deque",
        "companies": [
            "Microsoft",
            "+Atlassian"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/implement-stack-queue-using-deque/"
    },
    {
        "id": 134,
        "topic": "Stacks & Queues",
        "title": "Reverse first k elements of queue",
        "companies": [
            "Microsoft",
            "Amdocs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reverse-first-k-elements-of-queue/"
    },
    {
        "id": 135,
        "topic": "Stacks & Queues",
        "title": "Design Stack with Middle Operation",
        "companies": [
            "MaQ",
            "Software"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/design-stack-with-middle-operation/"
    },
    {
        "id": 136,
        "topic": "Stacks & Queues",
        "title": "Infix to Postfix",
        "companies": [
            "Amazon",
            "Samsung",
            "Paytm",
            "Vmware",
            "inc"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/infix-to-postfix/"
    },
    {
        "id": 137,
        "topic": "Stacks & Queues",
        "title": "Design and Implement Special stack",
        "companies": [
            "Amazon",
            "Google",
            "Microsoft",
            "Visa",
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/design-and-implement-special-stack/"
    },
    {
        "id": 138,
        "topic": "Stacks & Queues",
        "title": "Longest Valid String",
        "companies": [
            "Google",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-valid-string/"
    },
    {
        "id": 139,
        "topic": "Stacks & Queues",
        "title": "Find if an expression has duplicate parenthesis or not",
        "companies": [
            "Flipkart",
            "Oracle",
            "OYO",
            "Rooms",
            "Snapdeal",
            "Walmart",
            "Yatra.com",
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-if-an-expression-has-duplicate-parenthesis-or-not/"
    },
    {
        "id": 140,
        "topic": "Stacks & Queues",
        "title": "Stack permutations check if an array is stack permutation of other",
        "companies": [
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/stack-permutations-check-if-an-array-is-stack-permutation-of-other/"
    },
    {
        "id": 141,
        "topic": "Stacks & Queues",
        "title": "Count natural numbers whose permutation greater number",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-natural-numbers-whose-permutation-greater-number/"
    },
    {
        "id": 142,
        "topic": "Stacks & Queues",
        "title": "Sort a stack using Recursion",
        "companies": [
            "Amazon",
            "Goldman",
            "Sachs",
            "IBM",
            "Intuit",
            "Kuliza",
            "Yahoo",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/sort-a-stack-using-recursion/"
    },
    {
        "id": 143,
        "topic": "Stacks & Queues",
        "title": "Queue based approach for first non repeating character in a stream",
        "companies": [
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/queue-based-approach-for-first-non-repeating-character-in-a-stream/"
    },
    {
        "id": 144,
        "topic": "Stacks & Queues",
        "title": "The Celebrity Problem",
        "companies": [
            "Google",
            "Visa",
            "Apple"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/the-celebrity-problem/"
    },
    {
        "id": 145,
        "topic": "Stacks & Queues",
        "title": "Next larger Element",
        "companies": [
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/next-larger-element/"
    },
    {
        "id": 146,
        "topic": "Stacks & Queues",
        "title": "Distance of nearest cell",
        "companies": [
            "Flipkar",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/distance-of-nearest-cell/"
    },
    {
        "id": 147,
        "topic": "Stacks & Queues",
        "title": "Rotten-oranges",
        "companies": [
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rotten-oranges/"
    },
    {
        "id": 148,
        "topic": "Stacks & Queues",
        "title": "Next smaller element",
        "companies": [
            "Codenation"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/next-smaller-element/"
    },
    {
        "id": 149,
        "topic": "Stacks & Queues",
        "title": "Circular-tour",
        "companies": [
            "Codenation",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/circular-tour/"
    },
    {
        "id": 150,
        "topic": "Stacks & Queues",
        "title": "Efficiently implement k-stacks single array",
        "companies": [
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/efficiently-implement-k-stacks-single-array/"
    },
    {
        "id": 151,
        "topic": "Stacks & Queues",
        "title": "The celebrity problem",
        "companies": [
            "Google",
            "Visa",
            "Apple"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/the-celebrity-problem/"
    },
    {
        "id": 152,
        "topic": "Stacks & Queues",
        "title": "Iterative tower of hanoi",
        "companies": [
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/iterative-tower-of-hanoi/"
    },
    {
        "id": 153,
        "topic": "Stacks & Queues",
        "title": "Find the maximum of minimums for every window size in a given array",
        "companies": [
            "Amazon",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-maximum-of-minimums-for-every-window-size-in-a-given-array/"
    },
    {
        "id": 154,
        "topic": "Stacks & Queues",
        "title": "lru cache implementation",
        "companies": [
            "Microsoft",
            "Uber",
            "Alibaba"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/lru-cache-implementation/"
    },
    {
        "id": 155,
        "topic": "Stacks & Queues",
        "title": "Find a tour that visits all stations",
        "companies": [
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-a-tour-that-visits-all-stations/"
    },
    {
        "id": 156,
        "topic": "Greedy",
        "title": "Activity selection problem greedy algo",
        "companies": [
            "Facebook",
            "Morgan",
            "Stanley",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/activity-selection-problem-greedy-algo/"
    },
    {
        "id": 157,
        "topic": "Greedy",
        "title": "Greedy algorithm to find minimum number of coins",
        "companies": [
            "Accolite",
            "Amazon",
            "Morgan",
            "Stanley",
            "Oracle",
            "Paytm",
            "Samsung",
            "Snapdeal",
            "Synopsys",
            "Visa",
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/greedy-algorithm-to-find-minimum-number-of-coins/"
    },
    {
        "id": 158,
        "topic": "Greedy",
        "title": "Minimum sum two numbers formed digits array-2",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-sum-two-numbers-formed-digits-array-2/"
    },
    {
        "id": 159,
        "topic": "Greedy",
        "title": "Minimum sum absolute difference pairs two arrays",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-sum-absolute-difference-pairs-two-arrays/"
    },
    {
        "id": 160,
        "topic": "Greedy",
        "title": "Find maximum height pyramid from the given array of objects",
        "companies": [
            "Flipkart",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-maximum-height-pyramid-from-the-given-array-of-objects/"
    },
    {
        "id": 161,
        "topic": "Greedy",
        "title": "Minimum cost for acquiring all coins with k extra coins allowed with every coin",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-cost-for-acquiring-all-coins-with-k-extra-coins-allowed-with-every-coin/"
    },
    {
        "id": 162,
        "topic": "Greedy",
        "title": "Find maximum equal sum of every three stacks",
        "companies": [
            "Microsoft",
            "Amazon",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-maximum-equal-sum-of-every-three-stacks/"
    },
    {
        "id": 163,
        "topic": "Greedy",
        "title": "Job sequencing problem",
        "companies": [
            "Microsoft",
            "Acolite"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/job-sequencing-problem/"
    },
    {
        "id": 164,
        "topic": "Greedy",
        "title": "Greedy algorithm egyptian fraction",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/greedy-algorithm-egyptian-fraction/"
    },
    {
        "id": 165,
        "topic": "Greedy",
        "title": "Fractional knapsack problem",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/fractional-knapsack-problem/"
    },
    {
        "id": 166,
        "topic": "Greedy",
        "title": "Maximum length chain of pairs",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-length-chain-of-pairs/"
    },
    {
        "id": 167,
        "topic": "Greedy",
        "title": "Find smallest number with given number of digits and digit sum",
        "companies": [
            "MAQ",
            "Software",
            "OYO",
            "Rooms"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-smallest-number-with-given-number-of-digits-and-digit-sum/"
    },
    {
        "id": 168,
        "topic": "Greedy",
        "title": "Maximize sum of consecutive differences circular-array",
        "companies": [
            "Maccafe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximize-sum-of-consecutive-differences-circular-array/"
    },
    {
        "id": 169,
        "topic": "Greedy",
        "title": "paper-cut minimum number squares",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/paper-cut-minimum-number-squares/"
    },
    {
        "id": 170,
        "topic": "Greedy",
        "title": "Lexicographically smallest array-k consecutive swaps",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/lexicographically-smallest-array-k-consecutive-swaps/"
    },
    {
        "id": 171,
        "topic": "Greedy",
        "title": "Problems-CHOCOLA",
        "companies": [
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/problems-chocola/"
    },
    {
        "id": 172,
        "topic": "Greedy",
        "title": "Find minimum time to finish all jobs with given constraints",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-minimum-time-to-finish-all-jobs-with-given-constraints/"
    },
    {
        "id": 173,
        "topic": "Greedy",
        "title": "Job sequencing using disjoint set union",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/job-sequencing-using-disjoint-set-union/"
    },
    {
        "id": 174,
        "topic": "Greedy",
        "title": "Rearrange characters string such that no two adjacent are same",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rearrange-characters-string-such-that-no-two-adjacent-are-same/"
    },
    {
        "id": 175,
        "topic": "Greedy",
        "title": "Minimum edges to reverse to make path from a source to a destination",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-edges-to-reverse-to-make-path-from-a-source-to-a-destination/"
    },
    {
        "id": 176,
        "topic": "Greedy",
        "title": "Minimize Cash Flow among a given set of friends who have borrowed money from each other",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimize-cash-flow-among-a-given-set-of-friends-who-have-borrowed-money-from-each-other/"
    },
    {
        "id": 177,
        "topic": "Greedy",
        "title": "Minimum Cost to cut a board into squares",
        "companies": [
            "Maccafe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-cost-to-cut-a-board-into-squares/"
    },
    {
        "id": 178,
        "topic": "Binary Trees",
        "title": "Maximum Depth of Binary Tree",
        "companies": [
            "Amazon",
            "Cadence",
            "India",
            "CouponDunia",
            "D-E-Shaw",
            "FactSet",
            "FreeCharge",
            "MakeMyTrip"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/"
    },
    {
        "id": 179,
        "topic": "Binary Trees",
        "title": "Reverse Level Order Traversal",
        "companies": [
            "Amazon",
            "Microsoft",
            "flipkart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reverse-level-order-traversal/"
    },
    {
        "id": 180,
        "topic": "Binary Trees",
        "title": "Subtree of Another Tree",
        "companies": [
            "Amazon",
            "Microsoft",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/subtree-of-another-tree/"
    },
    {
        "id": 181,
        "topic": "Binary Trees",
        "title": "Invert Binary Tree",
        "companies": [
            "Amazon",
            "Hike"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/invert-binary-tree/"
    },
    {
        "id": 182,
        "topic": "Binary Trees",
        "title": "Binary Tree Level Order Traversal",
        "companies": [
            "Accolite",
            "Adobe",
            "Amazon",
            "Cisco",
            "D-E-Shaw",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/"
    },
    {
        "id": 183,
        "topic": "Binary Trees",
        "title": "Left View of Binary Tree",
        "companies": [
            "Microsoft",
            "Adobe",
            "Cisco",
            "Networking",
            "Academy"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/left-view-of-binary-tree/"
    },
    {
        "id": 184,
        "topic": "Binary Trees",
        "title": "Right View of Binary Tree",
        "companies": [
            "Amdocs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/right-view-of-binary-tree/"
    },
    {
        "id": 185,
        "topic": "Binary Trees",
        "title": "ZigZag Tree Traversal",
        "companies": [
            "Amazon",
            "Cisco",
            "FactSet",
            "Hike",
            "Snapdeal",
            "Walmart",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/zigzag-tree-traversal/"
    },
    {
        "id": 186,
        "topic": "Binary Trees",
        "title": "Create a mirror tree from the given binary tree",
        "companies": [
            "Accolite",
            "Adobe",
            "Amazon",
            "Belzabar",
            "EBay",
            "Goldman",
            "Sachs",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Myntra",
            "Ola",
            "Cabs",
            "Paytm"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/create-a-mirror-tree-from-the-given-binary-tree/"
    },
    {
        "id": 187,
        "topic": "Binary Trees",
        "title": "Leaf at same level",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/leaf-at-same-level/"
    },
    {
        "id": 188,
        "topic": "Binary Trees",
        "title": "Check for Balanced Tree",
        "companies": [
            "Amazon",
            "Walmart",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-for-balanced-tree/"
    },
    {
        "id": 189,
        "topic": "Binary Trees",
        "title": "Transform to Sum Tree",
        "companies": [
            "Amazon",
            "FactSet",
            "Microsoft",
            "Samsung",
            "Walmart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/transform-to-sum-tree/"
    },
    {
        "id": 190,
        "topic": "Binary Trees",
        "title": "Check if Tree is Isomorphic",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-if-tree-is-isomorphic/"
    },
    {
        "id": 191,
        "topic": "Binary Trees",
        "title": "Same Tree",
        "companies": [
            "Amazon",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/same-tree/"
    },
    {
        "id": 192,
        "topic": "Binary Trees",
        "title": "Construct Binary Tree from Preorder and Inorder Traversal",
        "companies": [
            "Accolite",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/"
    },
    {
        "id": 193,
        "topic": "Binary Trees",
        "title": "Height of Binary Tree",
        "companies": [
            "Amazon",
            "Cadence",
            "India",
            "CouponDunia",
            "D-E-Shaw",
            "FactSet",
            "FreeCharge",
            "MakeMyTrip"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/height-of-binary-tree/"
    },
    {
        "id": 194,
        "topic": "Binary Trees",
        "title": "Diameter of a Binary Tree",
        "companies": [
            "Amazon",
            "Microsoft",
            "OYO",
            "Rooms"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/diameter-of-a-binary-tree/"
    },
    {
        "id": 195,
        "topic": "Binary Trees",
        "title": "Top View of Binary Tree",
        "companies": [
            "Microsoft",
            "Adobe",
            "Expedia",
            "Group"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/top-view-of-binary-tree/"
    },
    {
        "id": 196,
        "topic": "Binary Trees",
        "title": "Bottom View of Binary Tree",
        "companies": [
            "DE",
            "Shaw",
            "India"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/bottom-view-of-binary-tree/"
    },
    {
        "id": 197,
        "topic": "Binary Trees",
        "title": "Diagonal Traversal of Binary Tree",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/diagonal-traversal-of-binary-tree/"
    },
    {
        "id": 198,
        "topic": "Binary Trees",
        "title": "Boundary Traversal of binary tree",
        "companies": [
            "Accolite",
            "Amazon",
            "FactSet",
            "Hike",
            "Kritikal",
            "Solutions"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/boundary-traversal-of-binary-tree/"
    },
    {
        "id": 199,
        "topic": "Binary Trees",
        "title": "Construct Binary Tree from String with Brackets",
        "companies": [
            "Microsoft",
            "Morgan",
            "Stanley",
            "OYO",
            "Rooms",
            "Payu",
            "Samsung",
            "Snapdeal",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/construct-binary-tree-from-string-with-brackets/"
    },
    {
        "id": 200,
        "topic": "Binary Trees",
        "title": "Minimum swap required to convert binary tree to binary search tree",
        "companies": [
            "Adobe",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-swap-required-to-convert-binary-tree-to-binary-search-tree/"
    },
    {
        "id": 201,
        "topic": "Binary Trees",
        "title": "Duplicate subtree in Binary Tree",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/duplicate-subtree-in-binary-tree/"
    },
    {
        "id": 202,
        "topic": "Binary Trees",
        "title": "Check if a given graph is tree or not",
        "companies": [
            "Microsoft",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-if-a-given-graph-is-tree-or-not/"
    },
    {
        "id": 203,
        "topic": "Binary Trees",
        "title": "Lowest Common Ancestor in a Binary Tree",
        "companies": [
            "Accolite",
            "Amazon",
            "American",
            "Express",
            "Cisco",
            "Expedia",
            "Flipkart",
            "MakeMyTrip",
            "Microsoft",
            "OYO",
            "Room"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/lowest-common-ancestor-in-a-binary-tree/"
    },
    {
        "id": 204,
        "topic": "Binary Trees",
        "title": "Min distance between two given nodes of a Binary Tree",
        "companies": [
            "Amazon",
            "Linkedin",
            "MakeMyTrip",
            "Ola",
            "Cabs",
            "Qualcomm",
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/min-distance-between-two-given-nodes-of-a-binary-tree/"
    },
    {
        "id": 205,
        "topic": "Binary Trees",
        "title": "Duplicate Subtrees",
        "companies": [
            "Ola"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/duplicate-subtrees/"
    },
    {
        "id": 206,
        "topic": "Binary Trees",
        "title": "Kth ancestor of a node in binary tree",
        "companies": [
            "Josh",
            "Technology",
            "Group"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kth-ancestor-of-a-node-in-binary-tree/"
    },
    {
        "id": 207,
        "topic": "Binary Trees",
        "title": "Binary Tree Maximum Path Sum",
        "companies": [
            "Samsung",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/binary-tree-maximum-path-sum/"
    },
    {
        "id": 208,
        "topic": "Binary Trees",
        "title": "Serialize and Deserialize Binary Tree",
        "companies": [
            "Flipkart",
            "InMobi",
            "Linkedin",
            "MAQ",
            "Software",
            "Microsoft",
            "Paytm",
            "Quikr",
            "Yahoo"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/"
    },
    {
        "id": 209,
        "topic": "Binary Trees",
        "title": "Binary Tree to DLL",
        "companies": [
            "Accolite",
            "Amazon",
            "Goldman",
            "Sachs",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Salesforce",
            "Snapdeal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/binary-tree-to-dll/"
    },
    {
        "id": 210,
        "topic": "Binary Trees",
        "title": "Print all k-sum paths in a binary tree",
        "companies": [
            "Accolite",
            "Amazon",
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-all-k-sum-paths-in-a-binary-tree/"
    },
    {
        "id": 211,
        "topic": "Binary Search Trees",
        "title": "Lowest Common Ancestor of a Binary Search Tree",
        "companies": [
            "Accolite",
            "Amazon",
            "Flipkart",
            "MAQ",
            "Software",
            "Microsoft",
            "Samsung",
            "Synopsys"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/"
    },
    {
        "id": 212,
        "topic": "Binary Search Trees",
        "title": "Binary Search Tree | Set 1 (Search and Insertion)",
        "companies": [
            "Accolite",
            "Amazon",
            "Microsoft",
            "Paytm",
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/binary-search-tree-set-1-search-and-insertion-/"
    },
    {
        "id": 213,
        "topic": "Binary Search Trees",
        "title": "Minimum element in BST",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-element-in-bst/"
    },
    {
        "id": 214,
        "topic": "Binary Search Trees",
        "title": "Predecessor and Successor",
        "companies": [
            "Google",
            "Adobe",
            "Goladman",
            "Sachs",
            "Direct"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/predecessor-and-successor/"
    },
    {
        "id": 215,
        "topic": "Binary Search Trees",
        "title": "Check whether BST contains Dead End",
        "companies": [
            "Walmart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-whether-bst-contains-dead-end/"
    },
    {
        "id": 216,
        "topic": "Binary Search Trees",
        "title": "Binary Tree to BST",
        "companies": [
            "HSBC"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/binary-tree-to-bst/"
    },
    {
        "id": 217,
        "topic": "Binary Search Trees",
        "title": "Kth largest element in BST",
        "companies": [
            "Accolite",
            "Amazon",
            "Samsung",
            "SAP",
            "Labs",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kth-largest-element-in-bst/"
    },
    {
        "id": 218,
        "topic": "Binary Search Trees",
        "title": "Validate Binary Search Tree",
        "companies": [
            "OYO",
            "Rooms",
            "Qualcomm",
            "Samsung",
            "Snapdeal",
            "VMWare",
            "Walmart",
            "Wooker",
            "Amazon",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/validate-binary-search-tree/"
    },
    {
        "id": 219,
        "topic": "Binary Search Trees",
        "title": "Kth Smallest Element in a BST",
        "companies": [
            "Accolite",
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kth-smallest-element-in-a-bst/"
    },
    {
        "id": 220,
        "topic": "Binary Search Trees",
        "title": "Delete Node in a BST",
        "companies": [
            "Adobe",
            "Barclays"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/delete-node-in-a-bst/"
    },
    {
        "id": 221,
        "topic": "Binary Search Trees",
        "title": "Flatten BST to sorted list",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/flatten-bst-to-sorted-list/"
    },
    {
        "id": 222,
        "topic": "Binary Search Trees",
        "title": "Preorder to Postorder",
        "companies": [
            "Amazon",
            "Linkedin",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/preorder-to-postorder/"
    },
    {
        "id": 223,
        "topic": "Binary Search Trees",
        "title": "Count BST nodes that lie in a given range",
        "companies": [
            "D-E-Shaw",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-bst-nodes-that-lie-in-a-given-range/"
    },
    {
        "id": 224,
        "topic": "Binary Search Trees",
        "title": "Populate Inorder Successor for all Nodes",
        "companies": [
            "Sap",
            "labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/populate-inorder-successor-for-all-nodes/"
    },
    {
        "id": 225,
        "topic": "Binary Search Trees",
        "title": "Convert Normal BST to Balanced BST",
        "companies": [
            "Paytm"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/convert-normal-bst-to-balanced-bst/"
    },
    {
        "id": 226,
        "topic": "Binary Search Trees",
        "title": "Merge two BSTs",
        "companies": [
            "DE",
            "Shaw",
            "India"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-two-bsts/"
    },
    {
        "id": 227,
        "topic": "Binary Search Trees",
        "title": "Given n appointments, find all conflicting appointments",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/given-n-appointments-find-all-conflicting-appointments/"
    },
    {
        "id": 228,
        "topic": "Binary Search Trees",
        "title": "Replace every element",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/replace-every-element/"
    },
    {
        "id": 229,
        "topic": "Binary Search Trees",
        "title": "Construct BST from given preorder traversal",
        "companies": [
            "Adobe",
            "Morgan",
            "Stanley",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/construct-bst-from-given-preorder-traversal/"
    },
    {
        "id": 230,
        "topic": "Binary Search Trees",
        "title": "Find median of BST in O(n) time and O(1) space",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-median-of-bst-in-o-n-time-and-o-1-space/"
    },
    {
        "id": 231,
        "topic": "Binary Search Trees",
        "title": "Largest BST in a Binary Tree",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Samsung",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "Important",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/largest-bst-in-a-binary-tree/"
    },
    {
        "id": 232,
        "topic": "Heaps & Hashing",
        "title": "Choose k array elements such that difference of maximum and minimum is minimized",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/choose-k-array-elements-such-that-difference-of-maximum-and-minimum-is-minimized/"
    },
    {
        "id": 233,
        "topic": "Heaps & Hashing",
        "title": "Heap Sort",
        "companies": [
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/heap-sort/"
    },
    {
        "id": 234,
        "topic": "Heaps & Hashing",
        "title": "Top K Frequent Elements",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/top-k-frequent-elements/"
    },
    {
        "id": 235,
        "topic": "Heaps & Hashing",
        "title": "k largest elements in an array",
        "companies": [
            "Amazon",
            "Microsoft",
            "Walmart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/k-largest-elements-in-an-array/"
    },
    {
        "id": 236,
        "topic": "Heaps & Hashing",
        "title": "Next Greater Element",
        "companies": [
            "Amazon",
            "Microsoft",
            "Flipkart",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/next-greater-element/"
    },
    {
        "id": 237,
        "topic": "Heaps & Hashing",
        "title": "K’th Smallest/Largest Element in Unsorted Array",
        "companies": [
            "ABCO",
            "Accolite",
            "Amazon",
            "Cisco",
            "Hike",
            "Microsoft",
            "Snapdeal",
            "VMWare",
            "Google",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/k-th-smallest-largest-element-in-unsorted-array/"
    },
    {
        "id": 238,
        "topic": "Heaps & Hashing",
        "title": "Find the maximum repeating number in O(n) time and O(1) extra space",
        "companies": [
            "Accolite",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-maximum-repeating-number-in-o-n-time-and-o-1-extra-space/"
    },
    {
        "id": 239,
        "topic": "Heaps & Hashing",
        "title": "K-th smallest element after removing some integers from natural numbers",
        "companies": [
            "ABCO",
            "Accolite",
            "Amazon",
            "Cisco",
            "Hike",
            "Microsoft",
            "Snapdeal",
            "VMWare",
            "Google",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/k-th-smallest-element-after-removing-some-integers-from-natural-numbers/"
    },
    {
        "id": 240,
        "topic": "Heaps & Hashing",
        "title": "Find k closest elements to a given value",
        "companies": [
            "Amazon",
            "OYO",
            "Rooms"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-k-closest-elements-to-a-given-value/"
    },
    {
        "id": 241,
        "topic": "Heaps & Hashing",
        "title": "K’th largest element in a stream",
        "companies": [
            "Amazon Cisco Hike OYO",
            "Rooms Walmart Microsoft Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/k-th-largest-element-in-a-stream/"
    },
    {
        "id": 242,
        "topic": "Heaps & Hashing",
        "title": "Connect Ropes",
        "companies": [
            "Amazoon",
            "Oyo",
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/connect-ropes/"
    },
    {
        "id": 243,
        "topic": "Heaps & Hashing",
        "title": "Cuckoo Hashing",
        "companies": [
            "Amaxon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/cuckoo-hashing/"
    },
    {
        "id": 244,
        "topic": "Heaps & Hashing",
        "title": "Itinerary from a List of Tickets",
        "companies": [
            "Microsoft",
            "Ola",
            "eBay"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/itinerary-from-a-list-of-tickets/"
    },
    {
        "id": 245,
        "topic": "Heaps & Hashing",
        "title": "Largest Subarray with 0 Sum",
        "companies": [
            "Amazon",
            "MakeMyTrip",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/largest-subarray-with-0-sum/"
    },
    {
        "id": 246,
        "topic": "Heaps & Hashing",
        "title": "Count distinct elements in every window of size  k",
        "companies": [
            "Accolite",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-distinct-elements-in-every-window-of-size-k/"
    },
    {
        "id": 247,
        "topic": "Heaps & Hashing",
        "title": "Group Shifted Strings",
        "companies": [
            "Oracle"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/group-shifted-strings/"
    },
    {
        "id": 248,
        "topic": "Heaps & Hashing",
        "title": "Merge K Sorted lists",
        "companies": [
            "Microsoft",
            "Ola",
            "eBay"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/merge-k-sorted-lists/"
    },
    {
        "id": 249,
        "topic": "Heaps & Hashing",
        "title": "Find Median from Data Stream",
        "companies": [
            "Adobe",
            "Amazon",
            "Apple",
            "Belzabar",
            "D-E-Shaw",
            "Facebook",
            "Flipkart",
            "Google",
            "Intuit",
            "Microsoft",
            "Morgan",
            "Stanley",
            "Ola",
            "Cabs",
            "Oracle",
            "Samsung",
            "SAP",
            "Labs",
            "Yahoo"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-median-from-data-stream/"
    },
    {
        "id": 250,
        "topic": "Heaps & Hashing",
        "title": "Sliding Window Maximum",
        "companies": [
            "Amazon",
            "Directi",
            "Flipkart",
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/sliding-window-maximum/"
    },
    {
        "id": 251,
        "topic": "Heaps & Hashing",
        "title": "Find the smallest positive number",
        "companies": [
            "Accolite",
            "Amazon",
            "Samsung",
            "Snapdeal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-smallest-positive-number/"
    },
    {
        "id": 252,
        "topic": "Heaps & Hashing",
        "title": "Find Surpasser Count of each element in array",
        "companies": [
            "Amazon",
            "Morgan",
            "Stanley",
            "Ola",
            "Cabs",
            "SAP",
            "Labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-surpasser-count-of-each-element-in-array/"
    },
    {
        "id": 253,
        "topic": "Heaps & Hashing",
        "title": "Tournament Tree and Binary Heap",
        "companies": [
            "Amazon",
            "Ola",
            "Cabs",
            "Samsung",
            "Synopsys",
            "Walmart",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/tournament-tree-and-binary-heap/"
    },
    {
        "id": 254,
        "topic": "Heaps & Hashing",
        "title": "Check for palindrome",
        "companies": [
            "Amazon",
            "Cisco",
            "D-E-Shaw",
            "Facebook",
            "FactSet",
            "Morgan",
            "Stanley",
            "Paytm",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/check-for-palindrome/"
    },
    {
        "id": 255,
        "topic": "Heaps & Hashing",
        "title": "Length of the largest subarray with contiguous elements",
        "companies": [
            "Amazon",
            "Intuit",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/length-of-the-largest-subarray-with-contiguous-elements/"
    },
    {
        "id": 256,
        "topic": "Heaps & Hashing",
        "title": "Palindrome Substring Queries",
        "companies": [
            "Amazon",
            "Morgan",
            "Stanley",
            "Ola",
            "Cabs",
            "SAP",
            "Labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/palindrome-substring-queries/"
    },
    {
        "id": 257,
        "topic": "Heaps & Hashing",
        "title": "Subarray distinct elements",
        "companies": [
            "Microsoft",
            "Ola",
            "eBay"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/subarray-distinct-elements/"
    },
    {
        "id": 258,
        "topic": "Heaps & Hashing",
        "title": "Find the recurring function",
        "companies": [
            "MAQ",
            "Software"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-recurring-function/"
    },
    {
        "id": 259,
        "topic": "Heaps & Hashing",
        "title": "K maximum sum combinations from two arrays",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/k-maximum-sum-combinations-from-two-arrays/"
    },
    {
        "id": 260,
        "topic": "Graphs",
        "title": "BFS",
        "companies": [
            "Samsung",
            "Delhivery",
            "SAP",
            "Labs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/bfs/"
    },
    {
        "id": 261,
        "topic": "Graphs",
        "title": "DFS",
        "companies": [
            "Samsung",
            "Intuit",
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/dfs/"
    },
    {
        "id": 262,
        "topic": "Graphs",
        "title": "Flood Fill Algorithm",
        "companies": [
            "Google",
            "Adobe",
            "Apple"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/flood-fill-algorithm/"
    },
    {
        "id": 263,
        "topic": "Graphs",
        "title": "Number of Triangles",
        "companies": [
            "IBM"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/number-of-triangles/"
    },
    {
        "id": 264,
        "topic": "Graphs",
        "title": "Detect cycle in a graph",
        "companies": [
            "Lenksart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/detect-cycle-in-a-graph/"
    },
    {
        "id": 265,
        "topic": "Graphs",
        "title": "Detect cycle in an undirected graph",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/detect-cycle-in-an-undirected-graph/"
    },
    {
        "id": 266,
        "topic": "Graphs",
        "title": "Rat in a Maze Problem",
        "companies": [
            "Sharechat",
            "Directi"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/rat-in-a-maze-problem/"
    },
    {
        "id": 267,
        "topic": "Graphs",
        "title": "Steps by Knight",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/steps-by-knight/"
    },
    {
        "id": 268,
        "topic": "Graphs",
        "title": "Clone graph",
        "companies": [
            "Google",
            "MAQ",
            "Software",
            "Apple",
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/clone-graph/"
    },
    {
        "id": 269,
        "topic": "Graphs",
        "title": "Number of Operations to Make Network Connected",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/number-of-operations-to-make-network-connected/"
    },
    {
        "id": 270,
        "topic": "Graphs",
        "title": "Dijkstra’s shortest path algorithm",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/dijkstra-s-shortest-path-algorithm/"
    },
    {
        "id": 271,
        "topic": "Graphs",
        "title": "Topological Sort",
        "companies": [
            "Amazon",
            "Google",
            "Flipkart",
            "Oyo",
            "Fipkart",
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/topological-sort/"
    },
    {
        "id": 272,
        "topic": "Graphs",
        "title": "Oliver and the Game",
        "companies": [
            "Sharechat",
            "Directi"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/oliver-and-the-game/"
    },
    {
        "id": 273,
        "topic": "Graphs",
        "title": "Minimum time taken by each job to be completed given by a Directed Acyclic Graph",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-time-taken-by-each-job-to-be-completed-given-by-a-directed-acyclic-graph/"
    },
    {
        "id": 274,
        "topic": "Graphs",
        "title": "Find whether it is possible to finish all tasks or not from given dependencies",
        "companies": [
            "Directi",
            "Sharechat"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-whether-it-is-possible-to-finish-all-tasks-or-not-from-given-dependencies/"
    },
    {
        "id": 275,
        "topic": "Graphs",
        "title": "Find the number of islands",
        "companies": [
            "Razorpay"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-number-of-islands/"
    },
    {
        "id": 276,
        "topic": "Graphs",
        "title": "Prim's Algo",
        "companies": [
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/prim-s-algo/"
    },
    {
        "id": 277,
        "topic": "Graphs",
        "title": "Negative Weighted Cycle",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/negative-weighted-cycle/"
    },
    {
        "id": 278,
        "topic": "Graphs",
        "title": "Floyd Warshall",
        "companies": [
            "Google",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/floyd-warshall/"
    },
    {
        "id": 279,
        "topic": "Graphs",
        "title": "Graph Coloring",
        "companies": [
            "Morgan",
            "Stanley"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/graph-coloring/"
    },
    {
        "id": 280,
        "topic": "Graphs",
        "title": "Snakes and Ladders",
        "companies": [
            "Goldman",
            "Sachs",
            "+Makemytrip"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/snakes-and-ladders/"
    },
    {
        "id": 281,
        "topic": "Graphs",
        "title": "Kosaraju's Theorem",
        "companies": [
            "Paytm"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kosaraju-s-theorem/"
    },
    {
        "id": 282,
        "topic": "Graphs",
        "title": "Journey to moon",
        "companies": [
            "Lenksart",
            "Payload"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/journey-to-moon/"
    },
    {
        "id": 283,
        "topic": "Graphs",
        "title": "Vertex Cover",
        "companies": [
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/vertex-cover/"
    },
    {
        "id": 284,
        "topic": "Graphs",
        "title": "M Coloring Problem",
        "companies": [
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/m-coloring-problem/"
    },
    {
        "id": 285,
        "topic": "Graphs",
        "title": "Cheapest Flights Within K Stops",
        "companies": [
            "Uber",
            "Paypal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/cheapest-flights-within-k-stops/"
    },
    {
        "id": 286,
        "topic": "Graphs",
        "title": "Find if there is a path of more than k length from a source",
        "companies": [
            "Cisco",
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-if-there-is-a-path-of-more-than-k-length-from-a-source/"
    },
    {
        "id": 287,
        "topic": "Graphs",
        "title": "Bellman Ford",
        "companies": [
            "Sharechat",
            "Directi"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/bellman-ford/"
    },
    {
        "id": 288,
        "topic": "Graphs",
        "title": "Bipartitie Graph",
        "companies": [
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/bipartitie-graph/"
    },
    {
        "id": 289,
        "topic": "Graphs",
        "title": "Word-Ladder",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-ladder/"
    },
    {
        "id": 290,
        "topic": "Graphs",
        "title": "Allen Dictionary",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/allen-dictionary/"
    },
    {
        "id": 291,
        "topic": "Graphs",
        "title": "Kruskals MST",
        "companies": [
            "Amazon",
            "Cisco",
            "Samsung"
        ],
        "remarks": "Important",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/kruskals-mst/"
    },
    {
        "id": 292,
        "topic": "Graphs",
        "title": "Total number spanning trees graph",
        "companies": [
            "Amazon",
            "Cisco",
            "Samsung",
            "Microsoft",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/total-number-spanning-trees-graph/"
    },
    {
        "id": 293,
        "topic": "Graphs",
        "title": "Travelling Salesman",
        "companies": [
            "Google",
            "Microsoft",
            "Opera"
        ],
        "remarks": "Important",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/travelling-salesman/"
    },
    {
        "id": 294,
        "topic": "Graphs",
        "title": "Find longest path directed acyclic graph",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-longest-path-directed-acyclic-graph/"
    },
    {
        "id": 295,
        "topic": "Graphs",
        "title": "Two Clique Problem",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/two-clique-problem/"
    },
    {
        "id": 296,
        "topic": "Graphs",
        "title": "Minimise the cash flow",
        "companies": [
            "Intuit",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimise-the-cash-flow/"
    },
    {
        "id": 297,
        "topic": "Graphs",
        "title": "Chinese postman",
        "companies": [
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/chinese-postman/"
    },
    {
        "id": 298,
        "topic": "Graphs",
        "title": "Water Jug",
        "companies": [
            "Intuit",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/water-jug/"
    },
    {
        "id": 299,
        "topic": "Graphs",
        "title": "Water Jug 2",
        "companies": [
            "MakeMyTrip",
            "MAQ",
            "Software"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/water-jug-2/"
    },
    {
        "id": 300,
        "topic": "Tries",
        "title": "Construct a trie from scratch",
        "companies": [
            "Accolite Amazon D-E-Shaw FactSet Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/construct-a-trie-from-scratch/"
    },
    {
        "id": 301,
        "topic": "Tries",
        "title": "Print unique rows in a given boolean matrix",
        "companies": [
            "Amazon",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/print-unique-rows-in-a-given-boolean-matrix/"
    },
    {
        "id": 302,
        "topic": "Tries",
        "title": "Word Break Problem | (Trie solution)",
        "companies": [
            "Amazon",
            "Google",
            "Hike",
            "IBM",
            "MAQ",
            "Software",
            "Microsoft",
            "Walmart",
            "Zoho"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-break-problem-trie-solution-/"
    },
    {
        "id": 303,
        "topic": "Tries",
        "title": "Given a sequence of words, print all anagrams together",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Goldman",
            "Sachs",
            "Morgan",
            "Stanley",
            "Snapdeal",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/given-a-sequence-of-words-print-all-anagrams-together/"
    },
    {
        "id": 304,
        "topic": "Tries",
        "title": "Find shortest unique prefix for every word in a given list",
        "companies": [
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-shortest-unique-prefix-for-every-word-in-a-given-list/"
    },
    {
        "id": 305,
        "topic": "Tries",
        "title": "Implement a Phone Directory",
        "companies": [
            "Amazon",
            "Microsoft",
            "Snapdeal"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/implement-a-phone-directory/"
    },
    {
        "id": 306,
        "topic": "DP",
        "title": "Knapsack with Duplicate Items",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/knapsack-with-duplicate-items/"
    },
    {
        "id": 307,
        "topic": "DP",
        "title": "BBT counter",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/bbt-counter/"
    },
    {
        "id": 308,
        "topic": "DP",
        "title": "Reach a given score",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/reach-a-given-score/"
    },
    {
        "id": 309,
        "topic": "DP",
        "title": "Maximum difference of zeros and ones in binary string",
        "companies": [
            "Ola"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-difference-of-zeros-and-ones-in-binary-string/"
    },
    {
        "id": 310,
        "topic": "DP",
        "title": "Climbing Stairs",
        "companies": [
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/climbing-stairs/"
    },
    {
        "id": 311,
        "topic": "DP",
        "title": "Permutation Coefficient",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/permutation-coefficient/"
    },
    {
        "id": 312,
        "topic": "DP",
        "title": "Longest Repeating Subsequence",
        "companies": [
            "Google",
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-repeating-subsequence/"
    },
    {
        "id": 313,
        "topic": "DP",
        "title": "Pairs with specific difference",
        "companies": [
            "Ola"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/pairs-with-specific-difference/"
    },
    {
        "id": 314,
        "topic": "DP",
        "title": "Longest subsequence-1",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-subsequence-1/"
    },
    {
        "id": 315,
        "topic": "DP",
        "title": "Coin Change",
        "companies": [
            "Microsoft+",
            "Samsung",
            "Barclays",
            "Apple",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/coin-change/"
    },
    {
        "id": 316,
        "topic": "DP",
        "title": "LIS",
        "companies": [
            "Amazon",
            "Google",
            "Facebook",
            "Fidelity",
            "International"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/lis/"
    },
    {
        "id": 317,
        "topic": "DP",
        "title": "Longest Common Subsequence",
        "companies": [
            "Siemens",
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-common-subsequence/"
    },
    {
        "id": 318,
        "topic": "DP",
        "title": "Word Break",
        "companies": [
            "Amazon",
            "Google",
            "Microsoft",
            "Walmart",
            "Apple",
            "IBM"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-break/"
    },
    {
        "id": 319,
        "topic": "DP",
        "title": "Combination Sum IV",
        "companies": [
            "Adobe",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/combination-sum-iv/"
    },
    {
        "id": 320,
        "topic": "DP",
        "title": "House Robber",
        "companies": [
            "Apple",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/house-robber/"
    },
    {
        "id": 321,
        "topic": "DP",
        "title": "Houe Robber 2",
        "companies": [
            "Arrays",
            "Dynamic",
            "Programming"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/houe-robber-2/"
    },
    {
        "id": 322,
        "topic": "DP",
        "title": "Decode Ways",
        "companies": [
            "Adobe",
            "Uber"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/decode-ways/"
    },
    {
        "id": 323,
        "topic": "DP",
        "title": "Unique Paths",
        "companies": [
            "Google",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/unique-paths/"
    },
    {
        "id": 324,
        "topic": "DP",
        "title": "Jumps Game",
        "companies": [
            "Facebook",
            "Amazon",
            "Microsoft",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/jumps-game/"
    },
    {
        "id": 325,
        "topic": "DP",
        "title": "Knapsack Problem",
        "companies": [
            "Amazon",
            "Directi",
            "Flipkart",
            "GreyOrange",
            "Microsoft",
            "Mobicip",
            "Morgan",
            "Stanley",
            "Oracle",
            "Payu",
            "Snapdeal",
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/knapsack-problem/"
    },
    {
        "id": 326,
        "topic": "DP",
        "title": "nCr",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/ncr/"
    },
    {
        "id": 327,
        "topic": "DP",
        "title": "Catalan Number",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/catalan-number/"
    },
    {
        "id": 328,
        "topic": "DP",
        "title": "Edit Distance",
        "companies": [
            "Google",
            "Goldman",
            "Sachs",
            "Citrix"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/edit-distance/"
    },
    {
        "id": 329,
        "topic": "DP",
        "title": "Subset Sum",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/subset-sum/"
    },
    {
        "id": 330,
        "topic": "DP",
        "title": "Gold mine",
        "companies": [
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/gold-mine/"
    },
    {
        "id": 331,
        "topic": "DP",
        "title": "Assembly Line Scheduling",
        "companies": [
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/assembly-line-scheduling/"
    },
    {
        "id": 332,
        "topic": "DP",
        "title": "Maximize The Cut Segments",
        "companies": [
            "Amazon",
            "OYO",
            "Rooms",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximize-the-cut-segments/"
    },
    {
        "id": 333,
        "topic": "DP",
        "title": "Maximum sum increasing subsequence",
        "companies": [
            "Amazon",
            "Morgan",
            "Stanley",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-sum-increasing-subsequence/"
    },
    {
        "id": 334,
        "topic": "DP",
        "title": "Count all subsequences having product less than K",
        "companies": [
            "Goldman",
            "Sachs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-all-subsequences-having-product-less-than-k/"
    },
    {
        "id": 335,
        "topic": "DP",
        "title": "Maximum sum increasing subsequence",
        "companies": [
            "Amazon",
            "Morgan",
            "Stanley",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-sum-increasing-subsequence/"
    },
    {
        "id": 336,
        "topic": "DP",
        "title": "Egg dropping puzzle",
        "companies": [
            "Amazon",
            "D-E-Shaw",
            "Goldman",
            "Sachs",
            "Google",
            "Hike",
            "MakeMyTrip",
            "MAQ",
            "Software",
            "Myntra",
            "Nearbuy",
            "Opera",
            "Oracle",
            "Philips",
            "Samsung",
            "Service",
            "Now",
            "Unisys",
            "VMWare",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/egg-dropping-puzzle/"
    },
    {
        "id": 337,
        "topic": "DP",
        "title": "Max length chain",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/max-length-chain/"
    },
    {
        "id": 338,
        "topic": "DP",
        "title": "Largest Square in Matrix",
        "companies": [
            "Amazon",
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/largest-square-in-matrix/"
    },
    {
        "id": 339,
        "topic": "DP",
        "title": "Maximum Path Sum",
        "companies": [
            "Amazon",
            "Microsoft",
            "Oyo",
            "Directi"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-path-sum/"
    },
    {
        "id": 340,
        "topic": "DP",
        "title": "Minimum Number of Jumps",
        "companies": [
            "Adobe",
            "Amazon",
            "Housing.com",
            "Moonfrog",
            "Labs",
            "Walmart",
            "Microsoft",
            "Google",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-number-of-jumps/"
    },
    {
        "id": 341,
        "topic": "DP",
        "title": "Minimum removals from array to make max – min <= K",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/minimum-removals-from-array-to-make-max-min-k/"
    },
    {
        "id": 342,
        "topic": "DP",
        "title": "Longest Common Substring",
        "companies": [
            "Webarch",
            "Club"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-common-substring/"
    },
    {
        "id": 343,
        "topic": "DP",
        "title": "Partition Equal Subset Sum",
        "companies": [
            "Amazon",
            "Accolite",
            "Traveloca",
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/partition-equal-subset-sum/"
    },
    {
        "id": 344,
        "topic": "DP",
        "title": "Longest Palindromic Subsequnce",
        "companies": [
            "Amazon",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-palindromic-subsequnce/"
    },
    {
        "id": 345,
        "topic": "DP",
        "title": "Count Palindromic Subsequences",
        "companies": [
            "Myntra"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-palindromic-subsequences/"
    },
    {
        "id": 346,
        "topic": "DP",
        "title": "Longest Palindromic Substring",
        "companies": [
            "Amazon",
            "Microsoft",
            "Samsung",
            "Visa"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-palindromic-substring/"
    },
    {
        "id": 347,
        "topic": "DP",
        "title": "Longest Alternating Sequence",
        "companies": [
            "Ola"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/longest-alternating-sequence/"
    },
    {
        "id": 348,
        "topic": "DP",
        "title": "Weighted Job Scheduling",
        "companies": [
            "Intuit"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/weighted-job-scheduling/"
    },
    {
        "id": 349,
        "topic": "DP",
        "title": "Coin Game",
        "companies": [
            "Salesforce"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/coin-game/"
    },
    {
        "id": 350,
        "topic": "DP",
        "title": "Coin Game Winner",
        "companies": [
            "Ola"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/coin-game-winner/"
    },
    {
        "id": 351,
        "topic": "DP",
        "title": "Optimal Strategy for a game",
        "companies": [
            "Google",
            "IBM"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/optimal-strategy-for-a-game/"
    },
    {
        "id": 352,
        "topic": "DP",
        "title": "Word Wrap",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/word-wrap/"
    },
    {
        "id": 353,
        "topic": "DP",
        "title": "Mobile numeric keypad",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/mobile-numeric-keypad/"
    },
    {
        "id": 354,
        "topic": "DP",
        "title": "Maximum Length of Pair Chain",
        "companies": [
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-length-of-pair-chain/"
    },
    {
        "id": 355,
        "topic": "DP",
        "title": "Matrix Chain Multiplication",
        "companies": [
            "Walmart",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/matrix-chain-multiplication/"
    },
    {
        "id": 356,
        "topic": "DP",
        "title": "Maximum profit by buying and selling a share at most twice",
        "companies": [
            "Accolite",
            "Amazon",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/maximum-profit-by-buying-and-selling-a-share-at-most-twice/"
    },
    {
        "id": 357,
        "topic": "DP",
        "title": "Optimal BST",
        "companies": [
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/optimal-bst/"
    },
    {
        "id": 358,
        "topic": "DP",
        "title": "Largest Submatrix with sum 0",
        "companies": [
            "Amazon",
            "MakeMyTrip",
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/largest-submatrix-with-sum-0/"
    },
    {
        "id": 359,
        "topic": "DP",
        "title": "Largest area rectangular sub-matrix with equal number of 1’s and 0’s",
        "companies": [
            "Amazon",
            "Directi",
            "Intuit",
            "MakeMyTrip",
            "Microsoft",
            "Samsung",
            "Google",
            "Flipkart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/largest-area-rectangular-sub-matrix-with-equal-number-of-1-s-and-0-s/"
    },
    {
        "id": 360,
        "topic": "Bit Manipulation",
        "title": "Count set bits in an integer",
        "companies": [
            "Adobe",
            "Apple"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-set-bits-in-an-integer/"
    },
    {
        "id": 361,
        "topic": "Bit Manipulation",
        "title": "Find the two non-repeating elements in an array of repeating elements",
        "companies": [
            "Accolite",
            "Amazon",
            "FactSet",
            "Google",
            "MakeMyTrip",
            "Microsoft",
            "Qualcomm",
            "Samsung"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-the-two-non-repeating-elements-in-an-array-of-repeating-elements/"
    },
    {
        "id": 362,
        "topic": "Bit Manipulation",
        "title": "Program to find whether a no is power of two",
        "companies": [
            "Adobe"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/program-to-find-whether-a-no-is-power-of-two/"
    },
    {
        "id": 363,
        "topic": "Bit Manipulation",
        "title": "Find position of the only set bit",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/find-position-of-the-only-set-bit/"
    },
    {
        "id": 364,
        "topic": "Bit Manipulation",
        "title": "Count number of bits to be flipped to convert A to B",
        "companies": [
            "Maq",
            "Software"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-number-of-bits-to-be-flipped-to-convert-a-to-b/"
    },
    {
        "id": 365,
        "topic": "Bit Manipulation",
        "title": "Count total set bits in all numbers from 1 to n",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-total-set-bits-in-all-numbers-from-1-to-n/"
    },
    {
        "id": 366,
        "topic": "Bit Manipulation",
        "title": "Copy set bits in a range",
        "companies": [
            "Facebook"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/copy-set-bits-in-a-range/"
    },
    {
        "id": 367,
        "topic": "Bit Manipulation",
        "title": "Calculate square of a number without using *, / and pow()",
        "companies": [
            "Amazon"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/calculate-square-of-a-number-without-using-and-pow-/"
    },
    {
        "id": 368,
        "topic": "Bit Manipulation",
        "title": "Divide two integers without using multiplication, division and mod operator",
        "companies": [
            "Microsoft"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/divide-two-integers-without-using-multiplication-division-and-mod-operator/"
    },
    {
        "id": 369,
        "topic": "Bit Manipulation",
        "title": "Power Set",
        "companies": [
            "Google",
            "Adobe",
            "Paytm"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/power-set/"
    },
    {
        "id": 370,
        "topic": "Segment Trees",
        "title": "Range Sum Query - Immutable",
        "companies": [],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/range-sum-query-immutable/"
    },
    {
        "id": 371,
        "topic": "Segment Trees",
        "title": "Range Minimum Query",
        "companies": [
            "Google",
            "Interview",
            "Qs"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/range-minimum-query/"
    },
    {
        "id": 372,
        "topic": "Segment Trees",
        "title": "Range Sum Query - Mutable",
        "companies": [
            "Alibaba"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/range-sum-query-mutable/"
    },
    {
        "id": 373,
        "topic": "Segment Trees",
        "title": "Create Sorted Array through Instructions",
        "companies": [
            "Samsung",
            "Accolite"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/create-sorted-array-through-instructions/"
    },
    {
        "id": 374,
        "topic": "Segment Trees",
        "title": "Count of Range Sum",
        "companies": [
            "Walmart"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-of-range-sum/"
    },
    {
        "id": 375,
        "topic": "Segment Trees",
        "title": "Count of Smaller Numbers After Self",
        "companies": [
            "Codenation",
            "Google"
        ],
        "remarks": "",
        "difficulty": "Medium",
        "platform": "LeetCode",
        "url": "https://leetcode.com/problems/count-of-smaller-numbers-after-self/"
    }
];
