# Transition Prompt: Replace Interim Page with New Landing Page

Use this prompt with a Claude agent when the team has approved the new landing page
and it's ready to replace the current interim auth/login page at `app/page.tsx`.

---

## Agent Prompt

You are helping replace the interim homepage of the SyncCycle app with the new landing page.
Here is what needs to happen:

### Context
- `app/page.tsx` is currently the interim page (auth form + video hero). It serves as the login/signup entry point.
- `app/landing/page.tsx` is the new landing page (currently "under construction").
- The goal is to make `app/landing/page.tsx` the primary public entry point (`/`), and move the auth flow to a dedicated route like `/auth` or `/login`.

### Steps

1. **Read both files first:**
   - `app/page.tsx` (interim auth page)
   - `app/landing/page.tsx` (new landing page)
   - `components/AuthForm.tsx` and `components/DemoLoginButton.tsx`
   - `app/dashboard/layout.tsx` (to understand where auth redirects go)

2. **Move the auth page:**
   - Create `app/auth/page.tsx` with the current contents of `app/page.tsx`
   - Update any redirect logic in `app/dashboard/layout.tsx` that currently sends unauthenticated users to `/` — change those to `/auth`
   - Check for any other hardcoded `/` redirects related to sign-out or auth guards across the codebase (`grep -r 'router.push("/")'`)

3. **Replace the landing page:**
   - Replace the contents of `app/page.tsx` with the real landing page content from `app/landing/page.tsx`
   - Remove the "Under Construction" placeholder text and build out the actual landing page design

4. **Update the sidebar logo link:**
   - In `components/dashboard/Sidebar.tsx`, the logo currently links to `/landing`
   - Update `href="/landing"` to `href="/"` so it points to the new root landing page

5. **Clean up:**
   - Delete `app/landing/page.tsx` (content is now at `app/page.tsx`)
   - Delete `app/landing/transition.md` (this file) once transition is complete
   - The `app/landing/` folder can be removed entirely

6. **Verify:**
   - Unauthenticated users visiting `/` see the new landing page
   - Clicking "Sign in" or "Get started" on the landing page routes to `/auth`
   - Authenticated/demo users clicking the sidebar logo go to `/`
   - Sign-out redirects to `/auth` (or `/`) — confirm the intended behavior with the team
   - Run `npm run build` to confirm no TypeScript or build errors
