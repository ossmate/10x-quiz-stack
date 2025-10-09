# Commit Guidelines

This document outlines the guidelines for composing commit messages using the Conventional Commits specification. Following these rules ensures that commit messages are consistent, well-organized, and provide valuable context for the development process.

## Conventional Commits Format

The basic structure of a commit message should be:

```
<type>(<scope>): <subject>
```

- **type**: Describes the nature of the commit. Common types include:
  - **feat**: A new feature for the application.
  - **fix**: A bug fix.
  - **docs**: Documentation or commit message improvements.
  - **style**: Changes that do not affect the meaning of the code (formatting, missing semicolons, etc.).
  - **refactor**: A code change that neither fixes a bug nor adds a feature.
  - **perf**: A code change that improves performance.
  - **test**: Adding missing tests or correcting existing tests.
  - **chore**: Changes to the build process, auxiliary tools, documentation generation, etc.

- **scope** (optional): A noun describing the section of the codebase being affected (e.g., `readme`, `api`, `ui`).

- **subject**: A brief description of the changes in the commit written in imperative mood.

## Commit Message Guidelines

- Write commit messages in the **imperative mood** (e.g., "Add new feature" instead of "Added new feature").
- Keep the subject line concise (50 characters or fewer when possible).
- Provide a detailed body if necessary, explaining what and why rather than how.
- Reference issues or pull requests in the body where applicable.

## Example Commit Messages

- `feat(auth): add registration and login functionality`
- `fix(api): correct error handling for user routes`
- `docs: update README.md with project details`
- `style: improve code formatting across multiple files`
- `chore: update dependencies and clean up code`

## Using Git Commands

1. **Stage your changes:**
   ```bash
   git add <file>
   ```

2. **Commit your changes:**
   ```bash
   git commit -m "type(scope): subject"
   ```

3. **Example command:**
   ```bash
   git commit -m "docs: update README.md with QuizStack project details"
   ```

## Additional Resources

For more details on Conventional Commits, visit:
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
