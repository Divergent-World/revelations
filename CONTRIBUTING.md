# Contributing

Thanks for helping develop the Revelations exhibition.

1. Fork and clone the repository.
2. Run `npm install`, copy `.env.example` to `.env.local`, and set `NEXT_PUBLIC_ASSET_BASE_URL` to a compatible public release host.
3. Run `npm test`, `npm run content:validate`, and `npm run build` before opening a pull request.

Canonical scene IDs are permanent public identifiers. Do not renumber them. The private Obsidian vault is an authoring source and must never be modified by release scripts.

Community features—comments, votes, uploads, and remixes—are intentionally outside the MVP. Propose those as separately moderated, identity-aware systems.
