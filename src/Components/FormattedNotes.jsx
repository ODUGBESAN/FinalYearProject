import "./FormattedNotes.css"

function inlineContent(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`")) return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>
    return <span key={`${keyPrefix}-${index}`}>{part}</span>
  })
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
      const codeLines = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith(fence)) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push(<pre className="formatted-notes-code" key={`code-${blocks.length}`}><code>{codeLines.join("\n")}</code></pre>)
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
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index].trim()) && !/^([-*]|\d+\.)\s+/.test(lines[index].trim()) && !/^(```|~~~)/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={`paragraph-${blocks.length}`}>{inlineContent(paragraph.join(" "), `paragraph-${blocks.length}`)}</p>)
  }

  return <div className="formatted-notes">{blocks}</div>
}

export { FormattedNotes }
