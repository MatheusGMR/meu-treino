

## Plan: Guarantee ElevenLabs Agent Transcribes and Inserts Data into Meu Treino

### Problem Analysis

The current flow has a critical gap: the `onMessage` handler in `VoiceAnamnesis.tsx` relies on ElevenLabs sending `user_transcript` and `agent_response` events. These events must be **individually enabled** in the ElevenLabs dashboard. If they are not enabled, `messagesRef.current` stays empty, and the `process-voice-anamnesis` function receives no data to extract.

Additionally, the current flow depends entirely on client-side message capture, which is fragile (browser tab close, network issues, etc.).

### Changes

#### 1. Add fallback: fetch conversation transcript from ElevenLabs API

After the conversation ends, if the client-side `messagesRef` has few messages, fetch the full transcript directly from the ElevenLabs API server-side. This acts as a safety net.

**File:** `supabase/functions/process-voice-anamnesis/index.ts`
- Accept an optional `conversationId` parameter alongside `messages`
- If `messages` is empty/short but `conversationId` is provided, call the ElevenLabs API (`GET /v1/convai/conversations/{conversation_id}`) using `ELEVENLABS_API_KEY` to retrieve the full transcript
- Use whichever source has more data (client messages vs API transcript)

#### 2. Capture conversation ID on the client

**File:** `src/components/client/anamnesis/VoiceAnamnesis.tsx`
- Use `conversation.getId()` to capture the conversation ID after connection
- Pass `conversationId` to `process-voice-anamnesis` alongside messages
- This enables the server-side fallback

#### 3. Improve client-side transcript resilience

**File:** `src/components/client/anamnesis/VoiceAnamnesis.tsx`
- In `onMessage`, also handle `conversation_initiation_metadata` to confirm events are streaming
- Lower the "too short" threshold from 3 to 1 message (even partial data is valuable with the server-side fallback)
- Add a visible message count indicator so the user knows data is being captured

#### 4. Ensure `process-voice-anamnesis` handles upsert

**File:** `supabase/functions/process-voice-anamnesis/index.ts`
- Change `.insert()` to `.upsert()` with `onConflict: 'client_id'` so re-running the anamnesis updates instead of failing on duplicate

### Technical Details

**ElevenLabs Conversations API call (server-side fallback):**
```typescript
const convResponse = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
  { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
);
const convData = await convResponse.json();
// convData.transcript contains array of {role, message} objects
```

**Conversation ID capture (client-side):**
```typescript
onConnect: () => {
  const id = conversation.getId();
  conversationIdRef.current = id;
}
```

**Dashboard requirements (user action):**
- Enable `user_transcript` and `agent_response` events in the ElevenLabs agent dashboard for agent `agent_2701kn7m5mm3fz990vpxgs8a9gwz`

### Summary of files to modify
1. `supabase/functions/process-voice-anamnesis/index.ts` — add ElevenLabs API fallback + upsert
2. `src/components/client/anamnesis/VoiceAnamnesis.tsx` — capture conversation ID, pass to edge function, improve resilience

