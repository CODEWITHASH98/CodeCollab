# Contributing to CodeCollab

Thank you for your interest in contributing to CodeCollab! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1.  **Fork the repository** to your GitHub account.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR-USERNAME/CodeCollab.git
    cd CodeCollab
    ```
3.  **Install dependencies**:
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```
4.  **Set up environment variables**:
    - Copy `.env.example` to `.env` in the `server` directory.
    - Fill in the required values (DATABASE_URL, JWT_SECRET, etc.).
5.  **Run locally**:
    ```bash
    # Terminal 1: Server
    cd server
    npm run dev

    # Terminal 2: Client
    cd client
    npm run dev
    ```

## Development Workflow

1.  **Create a branch**:
    ```bash
    git checkout -b feature/your-feature-name
    ```
2.  **Make changes**: Implement your feature or fix.
3.  **Run tests**: Ensure clear code and passing tests.
    ```bash
    npm test
    ```
4.  **Commit with conventional commits**:
    ```bash
    git commit -m "feat: add real-time cursor tracking"
    # or
    git commit -m "fix: resolve websocket connection timeout"
    ```
5.  **Push and create PR**:
    ```bash
    git push origin feature/your-feature-name
    ```
    - Open a Pull Request against the `main` branch.

## Code Style

- **Linting**: We use ESLint. Run `npm run lint` to check for issues.
- **Formatting**: We use Prettier. Ensure your code is formatted before committing.
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes.

## PR Guidelines

- **Descriptive Title**: Clearly state what the PR does.
- **Reference Issues**: Link to the issue your PR addresses (e.g., "Fixes #123").
- **Small & Focused**: Keep PRs focused on a single feature or fix.
- **Documentation**: Update documentation if you change behavior or add features.
- **Testing**: Add unit or integration tests for new features.

## Where to Contribute

Check out the [Issues](https://github.com/CODEWITHASH98/CodeCollab/issues) tab. Look for labels like:
- `good first issue` - Great for beginners.
- `help wanted` - We generally need help here.
- `bug` - Confirmed bugs that need fixing.

Thank you for helping make CodeCollab better!
