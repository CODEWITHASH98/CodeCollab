# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta] - 2024-01-29

### Added
- **Real-time Collaboration**: Multi-user editing with sub-100ms latency.
- **Language Support**: Execution support for 81+ programming languages via Piston.
- **AI Integration**:
    - AI-powered code hints (Llama 3.1/Groq).
    - Intelligent code review system.
- **Authentication**:
    - Guest login implementation.
    - Google and GitHub OAuth integration.
- **Security**: Added standard security policies and JWT-based auth flow.
- **Documentation**: Complete overhaul including Architecture, Development Journey, and Contribution guidelines.

### Changed
- Migrated WebSocket handling to dedicated service for better scalability.
- Optimized database queries for room state synchronization.

### Fixed
- Resolved race conditions in collaborative cursor tracking.
- Fixed layout responsiveness on mobile devices.

## [0.5.0] - 2023-12-15

### Added
- Initial project setup with React and Node.js.
- Basic Monaco Editor integration.
- Simple room creation and joining logic.
