# QuizStack

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
QuizStack is an MVP application designed to help users prepare for job interviews and learn programming theory through interactive quizzes. The app allows users to create, edit, and delete quizzes, take quizzes, and browse both personal and public quiz sets. Additionally, it features AI-powered quiz generation to help create new quizzes based on provided topics or texts.

## Tech Stack
- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (database, authentication) and AI integration via Openrouter.ai
- **CI/CD and Hosting:** GitHub Actions for CI/CD and Docker-based deployment on DigitalOcean

## Getting Started Locally
Follow these steps to set up the project on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ossmate/10x-quiz-stack.git
   cd 10x-quiz-stack
   ```

2. **Install dependencies:**
   Ensure you have the correct Node.js version as specified in `.nvmrc`, then install dependencies:
   ```bash
   nvm use
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app should now be running locally. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Available Scripts
In the project directory, you can run:

- **`npm run dev`**  
  Starts the development server.

- **`npm run build`**  
  Builds the project for production.

- **`npm run preview`**  
  Serves the production build locally for preview.

Additional scripts may be available in the `package.json`.

## Project Scope
QuizStack focuses on offering a simple yet interactive platform for quiz-based interview preparation and programming theory review. Core functionalities include:

- **Quiz Management:** Create, edit, and delete quizzes.
- **Quiz Taking:** Launch quizzes, record answers, and display results.
- **Quiz Browsing:** View and access both personal and public quiz sets.
- **AI Quiz Generation:** Automatically create quizzes based on user-provided topics.

**Boundaries:**
- Does not include progress tracking.
- Limited support for various question types.
- No ranking system implemented in the MVP.

## Project Status
This project is currently in its MVP phase. Core features have been developed, and ongoing improvements are being made based on user feedback. Contributions and suggestions are welcome!

## License
This project is licensed under the MIT License.
