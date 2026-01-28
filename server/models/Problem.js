export class Problem {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.difficulty = data.difficulty; // 'easy', 'medium', 'hard'
    this.category = data.category; // 'array', 'string', 'tree', etc.
    this.tags = data.tags || [];
    this.starterCode = data.starterCode || {};
    this.testCases = data.testCases || [];
    this.constraints = data.constraints || [];
    this.examples = data.examples || [];
    this.hints = data.hints || [];
    this.solution = data.solution || null;
    this.createdAt = new Date();
    this.stats = {
      attempts: 0,
      completions: 0,
      averageTime: 0,
    };
  }

  // Get starter code for specific language
  getStarterCode(language) {
    return this.starterCode[language] || this.starterCode.javascript || '';
  }

  // Add test case
  addTestCase(input, expectedOutput, isHidden = false) {
    this.testCases.push({
      input,
      expectedOutput,
      isHidden,
    });
  }

  // Get visible test cases (for candidates)
  getVisibleTestCases() {
    return this.testCases.filter(tc => !tc.isHidden);
  }

  // Get all test cases (for evaluation)
  getAllTestCases() {
    return this.testCases;
  }

  // Track attempt
  trackAttempt(completed, timeTaken) {
    this.stats.attempts++;
    
    if (completed) {
      this.stats.completions++;
      
      // Update average time
      const totalTime = this.stats.averageTime * (this.stats.completions - 1) + timeTaken;
      this.stats.averageTime = totalTime / this.stats.completions;
    }
  }

  // Get success rate
  getSuccessRate() {
    if (this.stats.attempts === 0) return 0;
    return (this.stats.completions / this.stats.attempts) * 100;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      difficulty: this.difficulty,
      category: this.category,
      tags: this.tags,
      constraints: this.constraints,
      examples: this.examples,
      hints: this.hints,
      starterCode: this.starterCode,
      testCases: this.getVisibleTestCases(),
      stats: {
        ...this.stats,
        successRate: this.getSuccessRate(),
      },
    };
  }

  // Mongoose schema
  static getMongooseSchema() {
    return {
      id: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'],
        required: true 
      },
      category: { 
        type: String,
        enum: ['array', 'string', 'tree', 'graph', 'dp', 'greedy', 'backtracking', 'other'],
        required: true
      },
      tags: [String],
      starterCode: {
        javascript: String,
        python: String,
        java: String,
        cpp: String,
      },
      testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
      }],
      constraints: [String],
      examples: [{
        input: String,
        output: String,
        explanation: String,
      }],
      hints: [String],
      solution: String,
      stats: {
        attempts: { type: Number, default: 0 },
        completions: { type: Number, default: 0 },
        averageTime: { type: Number, default: 0 },
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    };
  }
}

// Sample problems for initial data
export const sampleProblems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    difficulty: 'easy',
    category: 'array',
    tags: ['hash-map', 'array'],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Your code here
  
}`,
      python: `def two_sum(nums, target):
    # Your code here
    pass`,
    },
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
      { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true },
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    hints: [
      'Think about using a hash map to store numbers you\'ve seen',
      'For each number, check if target - number exists in the map',
    ],
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters.',
    difficulty: 'easy',
    category: 'string',
    tags: ['two-pointers', 'string'],
    starterCode: {
      javascript: `function reverseString(s) {
  // Your code here
  
}`,
      python: `def reverse_string(s):
    # Your code here
    pass`,
    },
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
    ],
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: 'Reverse the characters in the array',
      },
    ],
    hints: [
      'Use two pointers approach - one at start, one at end',
      'Swap characters and move pointers towards center',
    ],
  },
];
