# Deployment Notes

## GitHub Pages

1. Create a new GitHub repository.
2. Push this project to the repository's `main` branch.
3. In the repository settings, open **Pages**.
4. Set **Source** to **GitHub Actions**.
5. Push to `main` again or run the workflow manually.

The deployed URL will look like:

```txt
https://<user>.github.io/<repo>/
```

## Cloudflare Pages

Use these settings:

- Framework preset: None
- Build command: empty
- Build output directory: `/`
- Root directory: repository root

## Current Online Play Limitation

The current online room system uses `localStorage` and `BroadcastChannel`. It is useful for local development, but it is not real internet multiplayer yet. For production multiplayer, replace `src/online-local-room.js` with a Firebase, Supabase, or Cloudflare Durable Objects adapter.
