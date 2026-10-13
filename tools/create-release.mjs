/**
 * Create the GitHub release for a tag, with the notes read from a file.
 *
 * Kept as a script rather than an inline command because PowerShell mangles
 * non-ASCII in JSON bodies; Node keeps the UTF-8 unambiguous. The token comes
 * from git's credential store at runtime and is never written to disk.
 *
 * Usage:
 *   node tools/create-release.mjs <owner/repo> <tag> <notes-file> [name]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const [repo, tag, notesFile, name] = process.argv.slice(2)
if (!repo || !tag || !notesFile) {
  console.error('usage: node tools/create-release.mjs <owner/repo> <tag> <notes-file> [name]')
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

const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
  method: 'POST',
  headers: {
    Authorization: `token ${githubToken()}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dsh-plugin-publish',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tag_name: tag,
    name: name ?? tag,
    body: readFileSync(notesFile, 'utf8'),
    draft: false,
    prerelease: false,
  }),
})

const json = await res.json()
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, json.message ?? json)
  if (json.errors) console.error(json.errors)
  process.exit(1)
}
console.log(`release created: ${json.name}`)
console.log(`  ${json.html_url}`)
