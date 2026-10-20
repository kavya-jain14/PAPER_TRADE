# Authentication release checks

The authentication work remains on draft PR #2 until the checks below are complete.

## Refresh sessions

Refresh JWTs include a random token ID. The database stores `sha256:<hex digest>` of the whole token, never the raw JWT. Rotation uses a single conditional MongoDB update matching the account ID, session version, and current digest. A replay or competing request receives 401 and cleared cookies; a revoked session cannot rotate.

Earlier bcrypt refresh hashes are intentionally rejected. Bcrypt only considers the first 72 bytes, which can be identical for two refresh JWTs. Users with an old stored hash must sign in again. No database migration is required; successful password or Google login writes the new format. Access cookies keep their existing 15-minute expiry and session-version checks.

Run `npm test` in `paper_trade_backend`. The HTTP regression suite exercises the actual Express login/refresh routes with in-memory User-model stubs. It covers full-token storage, old-token replay, simultaneous rotation, legacy hashes, revoked sessions, tampered signatures, and wrong token types. These tests do not prove live MongoDB or provider integration.

## Registration challenges

A fresh registration during the email's resend cooldown returns 429 with `VERIFICATION_COOLDOWN` and `Retry-After`, without returning the earlier challenge ID. Reusing that earlier challenge would also reuse its pending password, which may have been supplied by another client. After the cooldown, restart registration to create a challenge bound to the newly submitted password; the earlier challenge is invalidated. A client already holding its own challenge ID can still use the resend endpoint.

The registration HTTP regressions cover initial verification, refusal to inherit an earlier registration, resend cooldown, and replacement after cooldown. Email delivery and database operations are stubbed; real delivery and MongoDB remain release gates below.

## Remaining release gates

- Current `main` trade-quantity validation changes have been integrated into the auth branch and checked. Recheck for newer base changes before merging.
- Check desktop and mobile previews for login, registration, verification, Study, and trading routes.
- Verify production configuration exists without exposing values: MongoDB, independent JWT/verification secrets, Google client ID, Resend delivery credentials/sender, HTTPS allowed origins, and the frontend Google client ID.
- In the preview environment, complete real Google sign-in and email registration/verification/resend/expiry, then reload and refresh the session through the same-origin `/api` proxy.
- Against MongoDB, send two simultaneous refresh requests and confirm only one succeeds; confirm logout and a new login invalidate the prior session.
- Confirm production `__Host-` cookies are Secure, HttpOnly, path `/`, and have no Domain attribute. Verify rejected origins and missing client headers cannot perform authenticated writes.
- Merge only after these checks pass. Inspect the deployment for the merged commit and repeat the sign-in/refresh/logout smoke test.
