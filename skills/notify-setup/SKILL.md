---
name: notify-setup
description: Set up or rotate phone push notifications for Claude Code (ntfy). Use when the user wants phone notifications, runs notify-setup, or asks to rotate/change their notification topic or server.
---

# Phone notification setup

The plugin's hook script reads two files from the plugin data directory `${CLAUDE_PLUGIN_DATA}`:
- `topic`: the user's secret ntfy topic (required)
- `server`: optional ntfy server URL; defaults to `https://ntfy.sh`

This setup is a conversation. Ask each question with the AskUserQuestion tool (fall back to a plain question if it is unavailable) and wait for the answer before moving on. Never skip a question, and never send the test notification before the user confirms they subscribed.

## 1. Check Node

Run `node --version`. It must be 18 or newer (the hook uses built-in `fetch`). If Node is missing or older, stop and tell the user to install Node 18+ from https://nodejs.org.

## 2. Prepare the topic (silently)

If `${CLAUDE_PLUGIN_DATA}/topic` already exists and the user did not ask to rotate it, reuse it. Otherwise create the directory and generate a new one:
`node -e "console.log('cc-'+require('crypto').randomBytes(16).toString('hex'))"`
Write the value (no trailing spaces) to `${CLAUDE_PLUGIN_DATA}/topic`.
If the user wants a self-hosted server, write its URL to `${CLAUDE_PLUGIN_DATA}/server`.

Do not show the topic yet.

## 3. Ask: is the app installed?

Ask: **"Is the ntfy app installed on your phone?"** with options **Yes** and **No**.

- **No:** tell the user to install **ntfy** (publisher: Philipp Heckel):
  - Google Play: https://play.google.com/store/apps/details?id=io.heckel.ntfy
  - F-Droid: https://f-droid.org/packages/io.heckel.ntfy/

  Tell them to open it once and allow notifications. Then ask question 3 again. Repeat until they answer Yes.
- **Yes:** go to step 4.

## 4. Give the topic and subscribe instructions

Show the topic in a code block on its own line so it is easy to copy, then these instructions:

1. Open the **ntfy** app.
2. Tap the **+** button (bottom right).
3. In **Topic name**, enter the topic exactly as shown above.
4. Leave **Use another server** off (if self-hosted: turn it on and enter the server URL).
5. Tap **Subscribe**.
6. Turn on **Instant delivery**: tap the subscription, then ⋮ → **Subscription settings** → **Instant delivery**. Without it, the Google Play version delivers through Firebase, which Android delays by minutes or drops. A small permanent "ntfy" notification while it runs is expected.
7. In Android Settings → Apps → ntfy → **Battery**, choose **Unrestricted**. On Xiaomi, Oppo, Vivo, Realme or OnePlus phones, also turn on **Autostart** for ntfy.

Also give the link `<server>/<topic>` (default `https://ntfy.sh/<topic>`). If `qrencode` is on PATH, print a QR code with `qrencode -t ANSIUTF8 "<server>/<topic>"`; otherwise skip it.

Remind them the topic is a secret: anyone who knows it can read the notifications.

## 5. Ask: subscribed?

Ask: **"Have you subscribed to the topic in the ntfy app?"** with options **Yes** and **No**.

- **No:** go back to step 4 (show the topic and the instructions again), then ask this question again. Repeat until they answer Yes.
- **Yes:** go to step 6.

## 6. Send the test notification

Run:
`echo '{"cwd":"setup-test","message":"Test notification from Claude Code"}' | CLAUDE_PLUGIN_DATA="${CLAUDE_PLUGIN_DATA}" node "${CLAUDE_PLUGIN_ROOT}/scripts/notify.js" input`

Then ask: **"Did the test notification arrive on your phone within a few seconds?"** with options **Yes** and **No**.

- **No:** check the server received it with `curl -s "<server>/<topic>/json?poll=1&since=5m"`.
  - If the output contains `Test notification from Claude Code`, the server got it. The phone side is the problem: the topic in the app is probably mistyped, **Instant delivery** is off for the subscription, or Android battery optimization is delaying ntfy. If notifications arrive minutes late or stop after the first few, it is almost always Instant delivery or battery optimization. Show the topic and instructions from step 4 again, then retry step 6.
  - If not, the send failed (network, firewall or server). Report that.
- **Yes:** go to step 7.

## 7. Wrap up

Tell the user they will get a push on every task finish and every input request. Remind them to keep **Instant delivery** on and ntfy's battery setting on **Unrestricted**, or pushes will be delayed again. Tapping a notification opens https://claude.ai/code. To answer the session from there, they should turn on **Remote Control for all sessions** in `/config` and sign in to the Claude app with the same account. To get a new topic later, run this skill again and ask to rotate.
