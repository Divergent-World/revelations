# R2 and Vercel deployment

## Cloudflare R2

Create a Standard-storage bucket such as `revelations-artwork` and an R2 API token scoped to object read/write for that bucket. Do not commit the account ID or access keys.

Build and upload the release:

```bash
npm run assets:release
npm run assets:validate
R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=revelations-artwork npm run assets:upload
```

Uploads are append-only: the command validates the complete release first and refuses to overwrite an existing versioned key. Publish changed artwork under a new version instead of replacing `v1`.

Use the bucket's rate-limited `r2.dev` endpoint only for local testing. Before launch, attach a domain you control from the bucket's **Settings → Custom Domains**, enable **Always Use HTTPS**, and configure Cloudflare Cache for the versioned release tree. Because release keys never change, the uploader gives every object `Cache-Control: public, max-age=31536000, immutable`.

## Vercel

Import the GitHub repository and set:

```text
NEXT_PUBLIC_ASSET_BASE_URL=https://the-production-r2-custom-domain.example
```

Deploy with `npm run build`. The application exports static HTML, CSS, and JavaScript to `out/`; it uses no functions, database, server actions, or Vercel image transformations.

After deployment verify the home page, all six tapestry routes, all six embed routes, all 22 chapter routes, scene deep links, and the archive download. Vercel Hobby may only host the initial personal, non-commercial exhibition; upgrade before commercial operation.
