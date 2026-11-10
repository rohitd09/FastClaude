// Claude Code hook -> ntfy push. Never fails the hook: every error path exits 0.
const fs = require('fs');
const path = require('path');

// Public URL of assets/icon-192.png (e.g. raw.githubusercontent.com/<owner>/<repo>/main/assets/icon-192.png).
// Empty = no icon. ntfy downloads it on the phone, so it must be publicly reachable.
const ICON_URL = '';

const dataDir = process.env.CLAUDE_PLUGIN_DATA || '';
const read = (f) => { try { return fs.readFileSync(path.join(dataDir, f), 'utf8').trim(); } catch { return ''; } };

async function main() {
  const topic = read('topic');
  if (!dataDir || !topic) return; // not set up yet: stay silent
  const server = (read('server') || 'https://ntfy.sh').replace(/\/+$/, '');

  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch {}

  const kind = process.argv[2] === 'input' ? 'input' : 'stop';
  const project = input.cwd ? path.basename(input.cwd) : 'Claude Code';
  // Only metadata goes to the (possibly public) server: no prompts, code or assistant output.
  const body = kind === 'input' ? (input.message || 'Claude needs your input') : 'Task finished';

  // Title goes in the query string: HTTP headers can't carry non-ASCII folder names.
  const title = encodeURIComponent(`Claude: ${project}`);
  await fetch(`${server}/${encodeURIComponent(topic)}?title=${title}`, {
    method: 'POST',
    body,
    headers: {
      Priority: kind === 'input' ? 'high' : 'default',
      Tags: kind === 'input' ? 'robot,question' : 'robot,white_check_mark',
      Click: 'https://claude.ai/code',
      ...(ICON_URL && { Icon: ICON_URL }),
    },
    signal: AbortSignal.timeout(5000),
  });
}

main().catch(() => {}).finally(() => process.exit(0));
