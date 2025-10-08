# Product Requirements Document (PRD) - QuizStack

## 1. Product Overview
QuizStack is an MVP application that enables users to prepare for job interviews and learn programming theory through quizzes. The application allows creating, editing, and deleting quizzes, taking quizzes, browsing both personal and public quiz sets, and generating quizzes using AI.

## 2. User Problem
Modern programmers and job interview candidates often struggle with a boring and tedious process of learning theory. The lack of interactivity and engaging learning methods makes interview preparation and knowledge retention less effective. QuizStack offers a solution through an interactive quiz system that makes the learning process more engaging and allows for personalized question sets.

## 3. Functional Requirements
- Quiz Management:
  - Creating a new quiz
  - Editing an existing quiz
  - Deleting a quiz
- Taking Quizzes:
  - Starting a quiz
  - Recording answers and results
- Browsing Quizzes:
  - User quiz list
  - Page with public quiz sets
- Generating Quizzes using AI:
  - Automatically creating a quiz based on provided context

## 4. Product Boundaries
- Progress tracking of quiz taking is not included
- There is no support for handling a wide range of question types
- A ranking system for best scores is not part of the MVP

## 5. User Stories
### US-001: User Authentication
- Title: Registration and Login
- Description: The user must be able to create an account and log in to access the application's functionalities.
- Acceptance Criteria:
  - The user can register using an email address and password
  - The user can log in and log out
  - An appropriate error message is displayed for incorrect credentials

### US-002: Creating a Quiz
- Title: Adding a New Quiz
- Description: A programmer can create a new quiz by defining the title, description, and set of questions.
- Acceptance Criteria:
  - The quiz creation form is available after logging in
  - All required fields must be completed
  - After creating a quiz, the user is redirected to the quiz summary view

### US-003: Editing a Quiz
- Title: Modifying an Existing Quiz
- Description: The user can edit a quiz by changing the content of questions, title, and description.
- Acceptance Criteria:
  - The user can open the quiz in edit mode
  - Changes are saved and reflected in the quiz details
  - The system displays a confirmation message after saving changes

### US-004: Deleting a Quiz
- Title: Deleting an Unnecessary Quiz
- Description: The user has the option to delete a quiz they no longer wish to use.
- Acceptance Criteria:
  - The delete option is available after logging in
  - The system asks for confirmation before deletion
  - After deletion, the quiz is no longer available in the user's list

### US-005: Browsing Personal Quizzes
- Title: User Quiz List
- Description: The user can view a list of all quizzes they have created.
- Acceptance Criteria:
  - After logging in, the user sees a list of their quizzes
  - The list includes basic information: title, creation date, number of questions

### US-006: Browsing Public Quizzes
- Title: Access to Public Quiz Sets
- Description: The user can browse and select quizzes shared publicly by other users.
- Acceptance Criteria:
  - The public quiz page displays a list of available sets
  - Each quiz includes information such as title and a brief description

### US-007: Taking a Quiz
- Title: Quiz Taking
- Description: The user launches a quiz, answers the questions, and receives a final result.
- Acceptance Criteria:
  - Upon selecting a quiz, the user is taken to the quiz interface
  - Answers are recorded, and the result is displayed upon completion
  - The user can retry the quiz

### US-008: Generating a Quiz using AI
- Title: Automatic Quiz Creation
- Description: The system generates a new quiz based on a provided text or topic, using AI mechanisms to prepare questions.
- Acceptance Criteria:
  - The user selects the option to generate a quiz
  - The system creates a set of questions based on the given criteria
  - The generated quiz can be edited before publication

## 6. Success Metrics
- 90% of users complete at least one quiz
- 75% of users are able to create their own quiz
- The application functions stably, and all key functionalities are fully operational
- An intuitive interface that indicates high user satisfaction
- Each user story has clear, testable acceptance criteria
