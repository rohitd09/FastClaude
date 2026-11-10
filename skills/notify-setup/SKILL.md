---
name: notify-setup
description: Set up or rotate phone push notifications for Claude Code (ntfy). Use when the user wants phone notifications, runs notify-setup, or asks to rotate/change their notification topic or server.
---

# Phone notification setup

The plugin's hook script reads two files from the plugin data directory `${CLAUDE_PLUGIN_DATA}`:
- `topic` — the user's secret ntfy topic (required)
- `server` — optional ntfy server URL; defaults to `https://ntfy.sh`

Do these steps in order:

1. **Check Node:** run `node --version`. It must be 18 or newer (the hook uses built-in `fetch`). If Node is missing or older, stop and tell the user to install Node 18+.

2. **Topic:** if `${CLAUDE_PLUGIN_DATA}/topic` already exists and the user did not ask to rotate it, reuse it. Otherwise create the directory and generate a new one:
   `node -e "console.log('cc-'+require('crypto').randomBytes(16).toString('hex'))"`
   Write the value (no trailing spaces) to `${CLAUDE_PLUGIN_DATA}/topic`.
   If the user wants a self-hosted server, write its URL to `${CLAUDE_PLUGIN_DATA}/server`.

3. **Subscribe the phone:** tell the user to install the **ntfy** app from Google Play or F-Droid, tap **+**, and enter the topic (use the server URL too if self-hosted). Also give them the link `https://ntfy.sh/<topic>`. If `qrencode` is on PATH, print a QR code with `qrencode -t ANSIUTF8 "https://ntfy.sh/<topic>"`; otherwise skip the QR code.
   Remind them the topic is a secret: anyone who knows it can read the notifications. To rotate it, run this skill again and ask to rotate.

4. **Test push:** run
   `echo '{"cwd":"setup-test","message":"Test notification from Claude Code"}' | CLAUDE_PLUGIN_DATA="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/scripts/notify.js" input`
   Ask the user to confirm it arrived on the phone.

5. **Answering from the phone:** tapping a notification opens https://claude.ai/code. To answer the session from there, the user should turn on Remote Control for all sessions in `/config` and sign in to the Claude app with the same account.
