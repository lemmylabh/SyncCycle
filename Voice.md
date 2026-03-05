# Voice.md — Voice Journaling Strategy

> **Later stage.** The `MobileFAB` already has an `onVoiceRecord` stub. Implement this after Mobile UI is shipped.

---

## What It Does

1. User taps **🎤 Record Your Day** in FAB menu
2. Browser records audio via MediaRecorder API
3. Audio sent to server → transcribed by Whisper
4. Text appended to today's journal (`daily_notes`)
5. Audio blob discarded — **never stored**

---

## Architecture

```
FAB → VoiceRecordModal
        │
        │  MediaRecorder (WebM/Opus in memory)
        │  User taps Stop
        ▼
POST /api/voice/transcribe  (multipart/form-data)
        │
        │  Buffer → OpenAI Whisper (whisper-1)
        │  Returns { text }
        │  Buffer discarded
        ▼
Append to daily_notes (today)
        ▼
Toast: "✓ Added to today's journal"
```

---

## Client — `VoiceRecordModal.tsx`

**MIME priority**: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` (Safari)

**State machine**:
```
idle → requesting_permission → recording → processing → done | error
```

**Max duration**: 3 minutes (auto-stop + countdown)

**UI per state**:
- `idle` — mic icon, "Tap to record"
- `recording` — pulsing red dot, elapsed timer, Stop + Cancel
- `processing` — spinner, "Transcribing…"
- `done` — "✓ Added to today's journal" (auto-close 1.5s)
- `error` — message + Retry

---

## Server — `/api/voice/transcribe/route.ts`

```ts
// POST multipart/form-data { audio: Blob }
const formData = await req.formData()
const audioBlob = formData.get("audio") as Blob
const buffer = Buffer.from(await audioBlob.arrayBuffer())
const file = new File([buffer], "recording.webm", { type: audioBlob.type })
const result = await openai.audio.transcriptions.create({ model: "whisper-1", file })
return NextResponse.json({ text: result.text })
// buffer GC'd — never written to disk or Supabase Storage
```

**Provider**: OpenAI Whisper via `openai` SDK — add `OPENAI_API_KEY` to `.env.local`
**Alternative**: Groq Whisper — free tier, ~10× faster

---

## Journal Append Logic

```ts
const existing = await supabase.from("daily_notes")
  .select("id, content").eq("user_id", userId).eq("log_date", todayStr).maybeSingle()

const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
const voiceEntry = `\n\n[Voice note, ${timestamp}]\n${transcription}`

if (existing.data) {
  await supabase.from("daily_notes")
    .update({ content: existing.data.content + voiceEntry }).eq("id", existing.data.id)
} else {
  await supabase.from("daily_notes")
    .insert({ user_id: userId, log_date: todayStr, content: transcription })
}
```

---

## Privacy Rules

- Audio blob lives in memory only — no IndexedDB, no localStorage, no file writes
- Server: buffer → Whisper → buffer GC'd — audio never persisted anywhere
- Only transcription text stored in `daily_notes.content`

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/mobile/VoiceRecordModal.tsx` | Recording UI + state machine |
| `app/api/voice/transcribe/route.ts` | Whisper API proxy |
| `lib/voiceUtils.ts` | MIME type detection, MediaRecorder helpers |

---

## Notes

- Whisper limit: 25MB — 3 min WebM ≈ 1.4MB, well within limits
- Remove `language: 'en'` for international user support
- `MobileFAB.onVoiceRecord` stub already in place — just wire it to open `VoiceRecordModal`
