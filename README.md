<p align="center"><img src="assets/icon-192.png" width="128" alt="FastClaude logo"></p>

# FastClaude

Get a push notification on your Android phone when Claude Code **finishes a task** or **needs your input** (a permission prompt or a question). Tap the notification to open your sessions at claude.ai/code and answer from your phone.

It uses Claude Code hooks and the free [ntfy](https://ntfy.sh) app. There is no server to run and no account to create.

## First, check whether you need this

If you use **Remote Control** and the official Claude app, Claude Code can already push to your phone. Run `/config` and turn on **Push when actions required** and **Push when Claude decides**.

This plugin is for the cases those toggles don't cover:
- You use an API key, Bedrock or Vertex, or your org has disabled Remote Control.
- You want a push on **every** task finish, not only when Claude decides one is worth sending.
- You want pushes even while your terminal has focus.

## Setup

### Requirements

- **Node.js 18 or newer** on the machine that runs Claude Code. Check with `node --version`. The hook uses Node's built-in `fetch`.
- **Claude Code** with plugin support (`/plugin` command available).
- An **Android phone** with internet access.

### Step 1: Install the ntfy app on your phone

Install **ntfy** from [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy) or [F-Droid](https://f-droid.org/packages/io.heckel.ntfy/). Open it once and allow notifications when Android asks.

### Step 2: Add the plugin to Claude Code

Start Claude Code and run:

```
/plugin marketplace add rohitd09/FastClaude
/plugin install fastclaude@fastclaude
```

Restart Claude Code (exit and run `claude` again) so the hooks load.

### Step 3: Run setup

```
/fastclaude:notify-setup
```

Setup checks your Node version and creates a private random topic (looks like `cc-3f9a...`). It then walks you through the rest by asking questions:

1. **"Is the ntfy app installed on your phone?"** If you answer No, it gives you the install links and asks again.
2. Once you answer Yes, it shows your topic and how to subscribe: in the ntfy app, tap **+**, enter the topic exactly as shown, and tap **Subscribe**. Leave the server as `ntfy.sh` unless you self-host.
3. **"Have you subscribed to the topic?"** If you answer No, it shows the topic and instructions again.

### Step 4: Confirm the test notification

Once you've subscribed, setup sends a test push titled **Claude: setup-test** and asks whether it arrived. If it didn't, setup checks whether the ntfy server received it and helps you fix it. See also [Troubleshooting](#troubleshooting).

### Step 5 (optional): Answer from your phone

Tapping a notification opens https://claude.ai/code. To act on the session from there, run `/config` in Claude Code, turn on **Remote Control for all sessions**, and sign in to the Claude app on your phone with the same account.

### Rotate the topic or use your own server

- **New topic:** run `/fastclaude:notify-setup` and say "rotate my topic". Then subscribe to the new topic in ntfy and remove the old one.
- **Self-hosted ntfy:** run `/fastclaude:notify-setup` and give it your server URL. In the ntfy app, use that server URL when subscribing.

### Troubleshooting

| Symptom | Fix |
|---|---|
| No test notification | Check the topic in the app matches exactly. Open `https://ntfy.sh/<topic>` in a browser and see whether the message appears there. |
| Test works, real events don't | Restart Claude Code after installing the plugin. Run `/hooks` to confirm the `Stop` and `Notification` hooks are listed. |
| Notifications arrive late | In Android settings, turn off battery optimization for ntfy. |
| `fetch is not defined` | Your Node is older than 18. Upgrade Node. |

### Uninstall

```
/plugin uninstall fastclaude@fastclaude
/plugin marketplace remove fastclaude
```

Then unsubscribe from the topic in the ntfy app.

## What you get

| Event | Notification | Priority |
|---|---|---|
| Claude needs permission, asks a question, or is waiting for you | Claude Code's own message, e.g. "Claude needs your permission to use Bash" | high |
| Claude finished responding | "Task finished" | default |

The title is `Claude: <project folder name>`.

## Privacy

- Notifications go through the public ntfy.sh server. The plugin only sends the **project folder name, the event type, and Claude Code's notification text**. It never sends your prompts, code or Claude's replies.
- Your topic name is the secret: anyone who knows it can read your notifications. Don't share it. To get a new one, run `/fastclaude:notify-setup` again and ask it to rotate the topic.
- To use your own server instead, [self-host ntfy](https://docs.ntfy.sh/install/) and ask setup to use your server URL.

## How it works

- `hooks/hooks.json` runs `scripts/notify.js` on the `Stop` event and on `Notification` events of these types: `permission_prompt`, `idle_prompt`, `elicitation_dialog` and `agent_needs_input`.
- `scripts/notify.js` reads the topic from the plugin's data folder and POSTs to `https://ntfy.sh/<topic>`.
- If anything fails (no topic yet, no network, the server is down), the script exits silently within 5 seconds, so Claude Code is never blocked.

## For AI agents: automated setup

This section is for an AI coding agent (Claude Code or similar) asked to set up FastClaude for a user. Do every step you can yourself. Stop and hand over to the human only at the points marked **HUMAN**.

### Facts you need

- Repository: `https://github.com/rohitd09/FastClaude`. Marketplace name: `fastclaude`. Plugin name: `fastclaude`.
- The hook script is `scripts/notify.js`. It reads two files from the plugin data directory (`$CLAUDE_PLUGIN_DATA`, set by Claude Code for the plugin's hooks and skills):
  - `topic`: required. The secret ntfy topic, one line, no trailing whitespace.
  - `server`: optional. ntfy server URL. Defaults to `https://ntfy.sh`.
- If `topic` is missing, the hook does nothing. It always exits 0 and never blocks Claude Code.
- Only the project folder name, event type, and Claude Code's notification text are sent. Never put prompts, code or secrets in a notification.

### Procedure

1. **Check Node.** Run `node --version`. If it fails or the major version is below 18, stop. **HUMAN:** ask the user to install Node.js 18+ from https://nodejs.org, then resume.

2. **Install the plugin.** `/plugin` commands are interactive slash commands. If you can run slash commands, run:
   ```
   /plugin marketplace add rohitd09/FastClaude
   /plugin install fastclaude@fastclaude
   ```
   If you cannot run slash commands, use the CLI equivalents from a shell:
   ```
   claude plugin marketplace add rohitd09/FastClaude
   claude plugin install fastclaude@fastclaude
   ```
   If neither works, **HUMAN:** ask the user to run the two `/plugin` commands above in Claude Code.

3. **Reload.** Hooks and the `notify-setup` skill load at session start. **HUMAN:** ask the user to restart Claude Code (exit, then run `claude`) and to tell you when done, unless you are running in a fresh session that already has the plugin.

4. **Run the setup skill.** Invoke `/fastclaude:notify-setup`. It will:
   - Reuse an existing topic, or generate one with
     `node -e "console.log('cc-'+require('crypto').randomBytes(16).toString('hex'))"`
     and write it to `$CLAUDE_PLUGIN_DATA/topic`.
   - Write `$CLAUDE_PLUGIN_DATA/server` only if the user asked for a self-hosted server.

   Do not rotate an existing topic unless the user asked. Rotating breaks their current phone subscription.

5. **Phone subscription. HUMAN required.** You cannot install apps on or control the user's phone. The skill handles this as a loop of questions; follow it:
   - Ask whether the **ntfy** app is installed. If not, give the Google Play / F-Droid links and ask again until they say yes.
   - Then show the topic, the link `https://ntfy.sh/<topic>` (or `<server>/<topic>` if self-hosted), and the instructions: tap **+**, enter the topic, tap **Subscribe**. Add a QR code if `qrencode` is on PATH: `qrencode -t ANSIUTF8 "https://ntfy.sh/<topic>"`. Remind them the topic is a secret.
   - Ask whether they subscribed. If not, show the topic and instructions again and ask again. Do not send the test push until they say yes.

6. **Send a test push.** Run:
   ```
   echo '{"cwd":"setup-test","message":"Test notification from Claude Code"}' | CLAUDE_PLUGIN_DATA="$CLAUDE_PLUGIN_DATA" node "$CLAUDE_PLUGIN_ROOT/scripts/notify.js" input
   ```
   The script is silent on success and on failure. To check delivery without the phone, fetch recent messages:
   ```
   curl -s "https://ntfy.sh/<topic>/json?poll=1&since=5m"
   ```
   A line containing `Test notification from Claude Code` means the server received it.

7. **Confirm on the phone. HUMAN required.** Ask the user whether the test notification arrived. If the server received it but the phone didn't, the user should check the topic spelling in the app and turn off battery optimization for ntfy.

8. **Optional, answer from the phone. HUMAN required.** Tell the user they can run `/config`, turn on **Remote Control for all sessions**, and sign in to the Claude app on their phone with the same account. You cannot do this for them because it involves their account login.

### Done when

- `$CLAUDE_PLUGIN_DATA/topic` exists and is non-empty.
- The test push was received by the server (step 6) and the user confirmed it on their phone (step 7).

Report to the user: the topic (remind them it is secret), how to rotate it, and that they will now get a push on every task finish and every input request.
