import "./FormattedNotes.css"

function inlineContent(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|<\/?[a-z][^>]*>|<!DOCTYPE[^>]*>)/gi).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>
    if (part.startsWith("<") && part.endsWith(">")) return <code key={`${keyPrefix}-${index}`}>{part}</code>
    return <span key={`${keyPrefix}-${index}`}>{part}</span>
  })
}

function isCodeLine(line) {
  const trimmed = line.trim()
  return /^<\/?[a-z][^>]*>$|^<!DOCTYPE[^>]*>$|^<[a-z][^>]*>.*<\/[a-z][^>]*>$/i.test(trimmed)
    || /^[.#]?[a-z][\w-]*\s*\{$/.test(trimmed)
    || /^\s{2,}[\w-]+\s*:\s*[^:]+;?\s*$/.test(line)
    || /^[a-z-]+\s*:\s*[^:;]+;\s*$/.test(trimmed)
    || /^\}$/.test(trimmed)
}

function syntaxHighlightedLine(line, lineIndex) {
  const tokens = line.split(/(<!DOCTYPE|<\/?[a-z][\w-]*|\/?\s*>|\b[a-zA-Z-]+(?==)|"[^"]*"|'[^']*')/gi).filter(Boolean)
  return <span className="formatted-code-line" key={`line-${lineIndex}`}><span className="formatted-code-number" aria-hidden="true">{lineIndex + 1}</span><span className="formatted-code-source">{tokens.map((token, index) => {
    let className = ""
    if (/^<!DOCTYPE$/i.test(token) || /^<\/?[a-z]/i.test(token)) className = "code-token-tag"
    else if (/^\/?\s*>$/.test(token)) className = "code-token-punctuation"
    else if (/^[a-zA-Z-]+$/.test(token)) className = "code-token-attribute"
    else if (/^["']/.test(token)) className = "code-token-string"
    return className ? <span className={className} key={index}>{token}</span> : token
  })}</span></span>
}

function codeEditor(code, key) {
  const language = /<!DOCTYPE|<\/?(?:html|head|body|meta|title|h[1-6]|p|a|img|ul|ol|li|div|span)\b/i.test(code) ? "HTML" : "CODE"
  return <div className="formatted-code-editor" role="region" aria-label={`${language} code example`} key={key}><div className="formatted-code-titlebar"><span className="formatted-code-lights"><i/><i/><i/></span><span>{language}</span></div><pre className="formatted-notes-code"><code>{code.split("\n").map(syntaxHighlightedLine)}</code></pre></div>
}

function FormattedNotes({ notes }) {
  const lines = String(notes || "").replace(/\r/g, "").split("\n")
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith("```") || line.startsWith("~~~")) {
      const fence = line.slice(0, 3)
      if (index + 1 >= lines.length || !isCodeLine(lines[index + 1])) {
        index += 1
        continue
      }
      const codeLines = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith(fence) && (isCodeLine(lines[index]) || !lines[index].trim())) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length && lines[index].trim().startsWith(fence)) index += 1
      blocks.push(codeEditor(codeLines.join("\n"), `code-${blocks.length}`))
      continue
    }

    if (isCodeLine(line)) {
      const codeLines = [lines[index]]
      index += 1
      while (index < lines.length && (isCodeLine(lines[index]) || (!lines[index].trim() && isCodeLine(lines[index + 1] || "")))) {
        codeLines.push(lines[index])
        index += 1
      }
      blocks.push(codeEditor(codeLines.join("\n"), `code-${blocks.length}`))
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      blocks.push(<h4 key={`heading-${blocks.length}`}>{inlineContent(heading[2], `heading-${blocks.length}`)}</h4>)
      index += 1
      continue
    }

    const listItem = line.match(/^([-*]|\d+\.)\s+(.+)$/)
    if (listItem) {
      const ordered = /^\d+\./.test(listItem[1])
      const items = []
      while (index < lines.length) {
        const match = lines[index].trim().match(/^([-*]|\d+\.)\s+(.+)$/)
        if (!match || /^\d+\./.test(match[1]) !== ordered) break
        items.push(<li key={`item-${items.length}`}>{inlineContent(match[2], `list-${blocks.length}-${items.length}`)}</li>)
        index += 1
      }
      const List = ordered ? "ol" : "ul"
      blocks.push(<List key={`list-${blocks.length}`}>{items}</List>)
      continue
    }

    const paragraph = [line]
    index += 1
    blocks.push(<p key={`paragraph-${blocks.length}`}>{inlineContent(paragraph.join(" "), `paragraph-${blocks.length}`)}</p>)
  }

  return <div className="formatted-notes">{blocks}</div>
}

export { FormattedNotes }
