# Settings Page Design

## Page Overview
- Settings page appears when user clicks "Settings" in main sidebar.
- Two-sidebar layout:
  1. **Main Sidebar** – always visible (Dashboard, Trackers, Insights, etc.)
  2. **Secondary Sidebar** – visible only when in Settings, shows settings categories.

## Secondary Sidebar Menu (flat, no groups)

1. Profile
2. Account
3. Dashboard
4. App Settings
5. Subscription
6. Connections
7. Help & Support

## ASCII Wireframe

```
┌──────────────┬─────────────────────────┬────────────────────────────────────┐
│              │                         │                                    │
│  MAIN        │  SETTINGS SIDEBAR       │  CONTENT AREA                      │
│  SIDEBAR     │                         │                                    │
│  (64/256px)  │  ⚙  Settings           │  ┌──────────────────────────────┐  │
│              │  ─────────────────────  │  │                              │  │
│  Dashboard   │  👤 Profile             │  │  [Section Title]             │  │
│  Insights    │  🔐 Account             │  │                              │  │
│  Ask Fiona   │  🗂  Dashboard          │  │  Content for selected item   │  │
│              │  🎨 App Settings        │  │  renders here.               │  │
│  Period      │  💳 Subscription        │  │                              │  │
│  Symptoms    │  🔗 Connections         │  │                              │  │
│  Vibe Check  │  ❓ Help & Support      │  │                              │  │
│  Journal     │                         │  └──────────────────────────────┘  │
│              │                         │                                    │
│  Nutrition   │                         │                                    │
│  Fitness     │                         │                                    │
│  Sleep       │                         │                                    │
│  ─────────── │                         │                                    │
│  ⚙ Settings  │                         │                                    │
│  (active)    │                         │                                    │
└──────────────┴─────────────────────────┴────────────────────────────────────┘

  ~64px              ~220px                         flex-1
  existing       bg-white/5 border-r             bg-[#0f0f13]
  sidebar        border-white/10
                 active item: violet-500 pill
```

## Layout Notes
- Secondary sidebar: `bg-white/5`, `border-r border-white/10`, width ~220px.
- Active item: violet-500 left pill indicator, consistent with main sidebar style.
- Clicking a category updates the main content area.
- Sections are built one by one — no need to design all at once.
- Mobile: secondary sidebar collapses into a top tab strip or drawer.


APP SETTINGS

# App Settings – Trackers Control

| Tracker       | Enabled | AI Access |
|---------------|---------|-----------|
| Period        | 🔘       | 🔘         |
| Mood          | 🔘       | 🔘         |
| Sleep         | 🔘       | 🔘         |
| Nutrition     | 🔘       | 🔘         |
| Exercise      | 🔘       | 🔘         |
| Symptoms      | 🔘       | 🔘         |

**Behavior Notes:**
- **Enabled toggle:** Turns the tracker on/off.  
- **AI Access toggle:** Gives AI access to that tracker.  
- **Rule:** If a tracker is disabled, AI access is automatically disabled.  
- **Optional:** AI Access can be disabled independently without affecting the tracker itself.  

Add save changes button, else changes are not saved

and not to forget, if trackers are disabled then the related card also disappears from the dashboard.