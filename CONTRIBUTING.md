# Contributing to NewsInsular

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy environment file: `cp .env.example .env.local`
4. Start development server: `pnpm dev:web`

## Code Style

- TypeScript strict mode enabled
- Use functional components with hooks
- Prefer `async/await` over `.then()` chains
- Use named exports for utilities
- Keep components small and focused

## Commit Messages

Format: `type: description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `test:` Tests
- `chore:` Maintenance

## Pull Requests

1. Create feature branch from `main`
2. Run `pnpm lint` before submitting
3. Describe changes in PR description
4. Request review from maintainers