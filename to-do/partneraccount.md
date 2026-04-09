Here’s a clean, focused prompt you can give to Claude:

---

Build a partner account linking system for a web app.

Core idea:
Subscribed users should be able to add a partner from Account Settings. The partner will get a special type of account with a different interface and will bypass onboarding.

Requirements:

* A main user can invite a partner by entering their email.
* Optionally, a secure invite link (token-based) can be generated.
* When the partner signs up:

  * If they use the invite link OR sign up with the invited email, they are automatically linked to the main user.
  * Their account is assigned a "partner" role.
  * Onboarding is skipped.
* The system must ensure only the intended partner can use the invite:

  * Token should be single-use and expire.
  * Email matching should be enforced if email invite is used.
* The main user should be able to see:

  * Partner name
  * Partner email
  * Status (pending / active)
* The partner should get a different UI/permissions than the main user.

Focus on:

* System design
* Database schema
* Secure invite handling
* Signup flow logic

Tech stack:

* Next.js
* Supabase (auth + database)

Avoid UI details, focus on backend logic and architecture.
