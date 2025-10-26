export interface DemoQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questions: DemoQuestion[];
}

export interface DemoQuestion {
  id: string;
  question: string;
  options: DemoOption[];
}

export interface DemoOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export const demoQuizzes: DemoQuiz[] = [
  {
    id: "demo-js",
    title: "JavaScript Fundamentals",
    description:
      "Test your knowledge of core JavaScript concepts including variables, functions, arrays, objects, and closures.",
    category: "JavaScript",
    estimatedTime: "5 minutes",
    difficulty: "beginner",
    questions: [
      {
        id: "js-q1",
        question: "What is the output of: typeof null?",
        options: [
          { id: "js-q1-a", text: '"null"', isCorrect: false },
          { id: "js-q1-b", text: '"object"', isCorrect: true },
          { id: "js-q1-c", text: '"undefined"', isCorrect: false },
          { id: "js-q1-d", text: '"number"', isCorrect: false },
        ],
      },
      {
        id: "js-q2",
        question: "Which method adds one or more elements to the end of an array?",
        options: [
          { id: "js-q2-a", text: "array.push()", isCorrect: true },
          { id: "js-q2-b", text: "array.pop()", isCorrect: false },
          { id: "js-q2-c", text: "array.shift()", isCorrect: false },
          { id: "js-q2-d", text: "array.unshift()", isCorrect: false },
        ],
      },
      {
        id: "js-q3",
        question: "What will be logged? const x = 10; function foo() { console.log(x); const x = 20; } foo();",
        options: [
          { id: "js-q3-a", text: "10", isCorrect: false },
          { id: "js-q3-b", text: "20", isCorrect: false },
          { id: "js-q3-c", text: "undefined", isCorrect: false },
          { id: "js-q3-d", text: "ReferenceError", isCorrect: true },
        ],
      },
      {
        id: "js-q4",
        question: "Which of the following creates a shallow copy of an array?",
        options: [
          { id: "js-q4-a", text: "[...array]", isCorrect: true },
          { id: "js-q4-b", text: "array.clone()", isCorrect: false },
          { id: "js-q4-c", text: "array.copy()", isCorrect: false },
          { id: "js-q4-d", text: "new Array(array)", isCorrect: false },
        ],
      },
      {
        id: "js-q5",
        question: "What is a closure in JavaScript?",
        options: [
          { id: "js-q5-a", text: "A function that returns another function", isCorrect: false },
          { id: "js-q5-b", text: "A function bundled with references to its surrounding state", isCorrect: true },
          { id: "js-q5-c", text: "A method to close browser windows", isCorrect: false },
          { id: "js-q5-d", text: "A way to prevent memory leaks", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "demo-react",
    title: "React Essentials",
    description: "Master the fundamentals of React including components, props, state, hooks, and JSX syntax.",
    category: "React",
    estimatedTime: "5 minutes",
    difficulty: "beginner",
    questions: [
      {
        id: "react-q1",
        question: "What is JSX?",
        options: [
          { id: "react-q1-a", text: "A JavaScript syntax extension that looks similar to HTML", isCorrect: true },
          { id: "react-q1-b", text: "A new programming language", isCorrect: false },
          { id: "react-q1-c", text: "A CSS preprocessor", isCorrect: false },
          { id: "react-q1-d", text: "A testing framework", isCorrect: false },
        ],
      },
      {
        id: "react-q2",
        question: "Which hook is used to manage state in a functional component?",
        options: [
          { id: "react-q2-a", text: "useEffect", isCorrect: false },
          { id: "react-q2-b", text: "useState", isCorrect: true },
          { id: "react-q2-c", text: "useContext", isCorrect: false },
          { id: "react-q2-d", text: "useReducer", isCorrect: false },
        ],
      },
      {
        id: "react-q3",
        question: "What is the correct way to pass data from parent to child component?",
        options: [
          { id: "react-q3-a", text: "Using props", isCorrect: true },
          { id: "react-q3-b", text: "Using state", isCorrect: false },
          { id: "react-q3-c", text: "Using refs", isCorrect: false },
          { id: "react-q3-d", text: "Using context only", isCorrect: false },
        ],
      },
      {
        id: "react-q4",
        question: "When does useEffect run by default?",
        options: [
          { id: "react-q4-a", text: "Only on mount", isCorrect: false },
          { id: "react-q4-b", text: "Only on unmount", isCorrect: false },
          { id: "react-q4-c", text: "After every render", isCorrect: true },
          { id: "react-q4-d", text: "Before every render", isCorrect: false },
        ],
      },
      {
        id: "react-q5",
        question: "What is the virtual DOM?",
        options: [
          { id: "react-q5-a", text: "A lightweight copy of the actual DOM", isCorrect: true },
          { id: "react-q5-b", text: "A browser API", isCorrect: false },
          { id: "react-q5-c", text: "A testing tool", isCorrect: false },
          { id: "react-q5-d", text: "A state management library", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "demo-ts",
    title: "TypeScript Basics",
    description: "Explore TypeScript fundamentals including types, interfaces, generics, and type guards.",
    category: "TypeScript",
    estimatedTime: "5 minutes",
    difficulty: "beginner",
    questions: [
      {
        id: "ts-q1",
        question: "What is the main benefit of using TypeScript?",
        options: [
          { id: "ts-q1-a", text: "Faster runtime performance", isCorrect: false },
          { id: "ts-q1-b", text: "Static type checking", isCorrect: true },
          { id: "ts-q1-c", text: "Smaller bundle size", isCorrect: false },
          { id: "ts-q1-d", text: "Better browser compatibility", isCorrect: false },
        ],
      },
      {
        id: "ts-q2",
        question: "How do you define an optional property in an interface?",
        options: [
          { id: "ts-q2-a", text: "propertyName?: type", isCorrect: true },
          { id: "ts-q2-b", text: "optional propertyName: type", isCorrect: false },
          { id: "ts-q2-c", text: "propertyName: type | null", isCorrect: false },
          { id: "ts-q2-d", text: "propertyName: Optional<type>", isCorrect: false },
        ],
      },
      {
        id: "ts-q3",
        question: 'What does the "any" type mean in TypeScript?',
        options: [
          { id: "ts-q3-a", text: "The variable can be of any type (disables type checking)", isCorrect: true },
          { id: "ts-q3-b", text: "The variable must be a string or number", isCorrect: false },
          { id: "ts-q3-c", text: "The variable is optional", isCorrect: false },
          { id: "ts-q3-d", text: "The variable is readonly", isCorrect: false },
        ],
      },
      {
        id: "ts-q4",
        question: "What is a generic in TypeScript?",
        options: [
          { id: "ts-q4-a", text: "A way to create reusable components that work with multiple types", isCorrect: true },
          { id: "ts-q4-b", text: "A type that can only be used once", isCorrect: false },
          { id: "ts-q4-c", text: "A built-in TypeScript utility", isCorrect: false },
          { id: "ts-q4-d", text: "A way to disable type checking", isCorrect: false },
        ],
      },
      {
        id: "ts-q5",
        question: "What is the purpose of a type guard?",
        options: [
          { id: "ts-q5-a", text: "To prevent type errors at compile time", isCorrect: false },
          { id: "ts-q5-b", text: "To narrow down the type within a conditional block", isCorrect: true },
          { id: "ts-q5-c", text: "To make all properties readonly", isCorrect: false },
          { id: "ts-q5-d", text: "To convert one type to another", isCorrect: false },
        ],
      },
    ],
  },
];

export function getDemoQuizById(id: string): DemoQuiz | undefined {
  return demoQuizzes.find((quiz) => quiz.id === id);
}

export function getAllDemoQuizzes(): DemoQuiz[] {
  return demoQuizzes;
}
