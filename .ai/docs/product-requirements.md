# Product Requirements Document (PRD) - QuizStack

## 1. Product Overview

QuizStack is an MVP application that enables users to prepare for job interviews and learn programming theory through quizzes. The application allows creating, editing, and deleting quizzes, taking quizzes, browsing both personal and public quiz sets, and generating quizzes using AI.

## 2. User Problem

Modern programmers and job interview candidates often struggle with a boring and tedious process of learning theory. The lack of interactivity and engaging learning methods makes interview preparation and knowledge retention less effective. QuizStack offers a solution through an interactive quiz system that makes the learning process more engaging and allows for personalized question sets.

## 3. Functional Requirements

- Quiz Management (requires authentication):
  - Creating a new quiz (logged-in users only)
  - Editing an existing quiz (logged-in users only, own quizzes)
  - Deleting a quiz (logged-in users only, own quizzes)
- Taking Quizzes:
  - Starting a quiz (all users can view and take public quizzes)
  - Recording answers and results (saved in database only for logged-in users)
  - Anonymous users can take quizzes but results are not persisted
- Browsing Quizzes:
  - User quiz list (logged-in users only, shows own quizzes)
  - Page with public quiz sets (accessible to all users)
- Generating Quizzes using AI (requires authentication):
  - Automatically creating a quiz based on provided context
  - Limited to 2 AI-generated quizzes per user (configurable for future expansion)

## 4. Product Boundaries

- Progress tracking of quiz taking is not included
- There is no support for handling a wide range of question types
- A ranking system for best scores is not part of the MVP
- AI quiz generation is limited to 2 quizzes per user in MVP (designed for future role-based or credit-based expansion)

## 5. User Stories

### US-001: User Authentication

- Title: Registration and Login
- Description: The user must be able to create an account and log in to access the application's quiz management functionalities.
- Acceptance Criteria:
  - Login and registration occur on dedicated pages
  - Login requires entering an email address and password
  - Registration requires entering an email address, password, and password confirmation
  - The user can log into the system via a button in the upper right corner
  - The user can log out of the system via a button in the upper right corner in the main Layout.astro
  - We do not use external login services (e.g., Google, GitHub)
  - Password recovery should be possible
  - An appropriate error message is displayed for incorrect credentials

### US-002: Creating a Quiz

- Title: Adding a New Quiz
- Description: A logged-in user can create a new quiz by defining the title, description, and set of questions.
- Acceptance Criteria:
  - The quiz creation form is available only to logged-in users
  - Unauthenticated users attempting to access the creation page are redirected to login
  - All required fields must be completed
  - After creating a quiz, the user is redirected to the quiz summary view

### US-003: Editing a Quiz

- Title: Modifying an Existing Quiz
- Description: A logged-in user can edit their own quiz by changing the content of questions, title, and description.
- Acceptance Criteria:
  - Only logged-in users can access the quiz edit mode
  - Users can only edit quizzes they have created
  - Unauthenticated users attempting to edit are redirected to login
  - Changes are saved and reflected in the quiz details
  - The system displays a confirmation message after saving changes

### US-004: Deleting a Quiz

- Title: Deleting an Unnecessary Quiz
- Description: A logged-in user has the option to delete their own quiz they no longer wish to use.
- Acceptance Criteria:
  - The delete option is available only to logged-in users
  - Users can only delete quizzes they have created
  - The system asks for confirmation before deletion
  - After deletion, the quiz is no longer available in the user's list

### US-005: Browsing Personal Quizzes

- Title: User Quiz List
- Description: A logged-in user can view a list of all quizzes they have created.
- Acceptance Criteria:
  - Only logged-in users can access their personal quiz list
  - After logging in, the user sees a list of their own quizzes
  - The list includes basic information: title, creation date, number of questions
  - Unauthenticated users attempting to access this page are redirected to login

### US-006: Browsing Public Quizzes

- Title: Access to Public Quiz Sets
- Description: Any user (both authenticated and unauthenticated) can browse and select quizzes shared publicly by other users.
- Acceptance Criteria:
  - The public quiz page is accessible to all users without authentication
  - The public quiz page displays a list of available sets
  - Each quiz includes information such as title and a brief description

### US-007: Taking a Quiz

- Title: Quiz Taking
- Description: Any user can launch a public quiz, answer the questions, and receive a final result. Only logged-in users have their attempts saved in the database.
- Acceptance Criteria:
  - Upon selecting a public quiz, any user is taken to the quiz interface
  - Both authenticated and unauthenticated users can take public quizzes
  - Quiz attempts are saved in the database only for logged-in users
  - Anonymous users can complete quizzes and see results, but attempts are not persisted
  - The result is displayed upon completion for all users
  - The user can retry the quiz

### US-008: Generating a Quiz using AI

- Title: Automatic Quiz Creation
- Description: A logged-in user can generate a new quiz based on a provided text or topic, using AI mechanisms to prepare questions. Users have a quota limit to control resource usage.
- Acceptance Criteria:
  - Only logged-in users can access the AI quiz generation feature
  - Unauthenticated users attempting to generate a quiz are redirected to login
  - Users can see their remaining AI generation quota before generating
  - Users are limited to 2 AI-generated quizzes (configurable via environment variables)
  - The system prevents generation when quota limit is reached
  - Clear error message is displayed when limit is exceeded
  - The user selects the option to generate a quiz
  - The system creates a set of questions based on the given criteria
  - The generated quiz can be edited before publication
  - Quota count updates after successful quiz generation

## 6. Success Metrics

- 90% of users complete at least one quiz
- 75% of users are able to create their own quiz
- The application functions stably, and all key functionalities are fully operational
- An intuitive interface that indicates high user satisfaction
- Each user story has clear, testable acceptance criteria
