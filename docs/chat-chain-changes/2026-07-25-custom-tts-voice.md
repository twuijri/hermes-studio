---
date: 2026-07-25
pr: pending
feature: Custom OpenAI-compatible TTS voice selection
impact: Custom TTS playback can persist and send a configured voice instead of always relying on the provider default.
---

Custom OpenAI-compatible TTS connections now expose the same voice field used by
other speech providers. The Add TTS API dialog renders a free-text Voice input
for every preset that declares the `voices` capability, while Doubao keeps its
curated picker and resource-id mapping. Selecting the custom provider copies the
stored voice into the legacy playback state, and group-chat playback includes
that voice in the server synthesize request.

The legacy custom voice now defaults to empty instead of `alloy`, and group-chat
playback omits the field when it is empty, so an existing stored provider voice
is never overwritten by a client-side default during an upgrade.

Chat text, session persistence, and message ordering are unchanged.
