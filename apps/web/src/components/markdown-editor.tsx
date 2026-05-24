'use client'

import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number | string
}

export default function MarkdownEditor({ value, onChange, height = 300 }: MarkdownEditorProps) {
  return (
    <CodeMirror
      value={value}
      height={`${height}px`}
      extensions={[
        markdown(),
        EditorView.lineWrapping,
      ]}
      spellCheck={true}
      onChange={onChange}
      className="border rounded-lg overflow-hidden"
    />
  )
}