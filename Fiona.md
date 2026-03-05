# Ask Luna — /dashboard/luna UI Prompt & Setup

This single markdown file contains everything you need to set up the Ask Luna dashboard page with Claude/OpenRouter.

---

## Environment Setup

In a `.env` file in your project root:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```



---

## Prompt Instructions for Claude/OpenRouter

**Goal:** Design the `/dashboard/luna` UI using the ASCII layout below.

**Rules for the AI:**

* Access to **all 7 trackers** from Supabase for context.
* Replies must be **sensitive and coaching-focused**, and **avoid giving medical advice**.
* Provide guidance, reflection prompts, and wellness coaching only.
* Greeting at the top should be **prominent and time-of-day aware**, e.g., “🌅 Good Morning, Alex! How are you feeling today?”
* **Input text field above the toolbar** containing attachments, tracker dropdown, and send button.
* **Chat history column on the right** should align to the bottom of the typing area.

---

## ASCII Layout

```
┌───────────────────────────────────────────────────────────────┐┌───────────────┐
│                        Ask Luna 🔮                            ││ Chat History   │
│                                                                ││───────────────│
└───────────────────────────────────────────────────────────────┘│ - Session 1    │
┌───────────────────────────────────────────────────────────────┐│ - Session 2    │
│                                                               ││ - Session 3    │
│   ╔══════════════════════════════════════════════════════╗    ││ - Session 4    │
│   ║                                                      ║    ││ - Session 5    │
│   ║  🌅 Good Morning, Username!                             ║    ││ - Session 6    │
│   ║  How are you feeling today?                          ║    ││ - Session 7    │
│   ║                                                      ║    ││ ...           │
│   ╚══════════════════════════════════════════════════════╝    ││               │
│                                                               ││               │
│   ┌───────────────────────────────────────────────────────┐   ││               │
│   │ Luna: Example response bubble…                        │   ││               │
│   └───────────────────────────────────────────────────────┘   ││               │
│                                                               ││               │
└───────────────────────────────────────────────────────────────┘│               │
┌───────────────────────────────────────────────────────────────┐│               │
│ Type your message…                                             ││               │
│                                                               ││               │
│ [📎 Attach File]   [Tracker: ▼]         [Send]                ││               │
└───────────────────────────────────────────────────────────────┘└───────────────┘
```

---
