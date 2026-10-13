/**
 * Update the GitHub repository description with correct UTF-8.
 *
 * PowerShell's ConvertTo-Json mangles non-ASCII, so this small script does the
 * PATCH from Node where the encoding is unambiguous. The token is read from
 * git's credential store at runtime and never written to disk.
 *
 * Usage:
 *   node tools/set-repo-description.mjs <owner/repo> "<description>"
 */
import { execFileSync } from 'node:child_process'

const [repo, description] = process.argv.slice(2)
if (!repo || !description) {
  console.error('usage: node tools/set-repo-description.mjs <owner/repo> "<description>"')
  process.exit(2)
}

/** Read the stored GitHub credential from git's credential helper. */
function githubToken() {
  const out = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  })
  const line = out.split('\n').find(l => l.startsWith('password='))
  if (!line) throw new Error('no GitHub credential found in git credential store')
  return line.slice('password='.length)
}

const res = await fetch(`https://api.github.com/repos/${repo}`, {
  method: 'PATCH',
  headers: {
    Authorization: `token ${githubToken()}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dsh-plugin-publish',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ description }),
})

const json = await res.json()
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, json.message ?? json)
  process.exit(1)
}
console.log('description updated:')
console.log(' ', json.description)
