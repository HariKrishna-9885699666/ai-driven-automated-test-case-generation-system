import toast from 'react-hot-toast'

/**
 * Parse the structured error strings emitted by the backend.
 * Format: "CODE|key=val|...|Human readable message"
 *
 * @param {string|null} raw
 * @returns {{ type: string, message: string, meta: Record<string,string> }}
 */
export function parseError(raw) {
  if (!raw) return { type: 'generic', message: 'Unknown error', meta: {} }

  const parts = raw.split('|')
  if (parts.length >= 3) {
    const type = parts[0]
    const meta = {}
    let msgStart = 1
    for (let i = 1; i < parts.length; i++) {
      const kv = parts[i].split('=')
      if (kv.length === 2) {
        meta[kv[0]] = kv[1]
        msgStart = i + 1
      } else {
        msgStart = i
        break
      }
    }
    return { type, message: parts.slice(msgStart).join('|'), meta }
  }

  return { type: 'generic', message: raw, meta: {} }
}

/**
 * Copy text to the system clipboard and show a toast on success.
 *
 * @param {string} text
 * @param {string} [successMsg='Copied!']
 */
export function copyToClipboard(text, successMsg = 'Copied!') {
  navigator.clipboard.writeText(text ?? '').then(() => {
    toast.success(successMsg)
  })
}

/**
 * Trigger a browser file-download for the given text content.
 *
 * @param {string} content   - Text content to save
 * @param {string} filename  - Suggested filename (e.g. "generated_tests.py")
 * @param {string} [successMsg='Saved!']
 */
export function downloadFile(content, filename, successMsg = 'Saved!') {
  const blob = new Blob([content ?? ''], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast.success(successMsg)
}

/**
 * Strip markdown code-fence wrappers the LLM sometimes adds.
 * e.g.  ```python\n...code...\n```  →  ...code...
 *
 * @param {string} code
 * @returns {string}
 */
export function stripCodeFences(code) {
  if (!code) return ''
  return code
    .trim()
    .replace(/^```[\w]*\n?/, '')
    .replace(/\n?```$/, '')
    .trim()
}
