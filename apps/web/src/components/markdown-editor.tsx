'use client'

import { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Code,
  Undo,
  Redo,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  RemoveFormatting,
  Eye,
  Code2,
  Maximize,
  Minimize,
  ChevronDown,
} from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number | string
}



const TEXT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#800000', '#000080', '#808000', '#FFC0CB',
  '#A52A2A', '#D2691E', '#696969', '#2F4F4F', '#4B0082',
]



export default function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  const [showHtml, setShowHtml] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showColor, setShowColor] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Color,
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Escribe el contenido aquí...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[100px] p-4',
        style: `min-height: ${typeof height === 'number' ? `${height}px` : height}`,
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL de la imagen')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const toggleHtmlView = useCallback(() => {
    if (!editor) return
    if (showHtml) {
      editor.commands.setContent(htmlValue)
      onChange(htmlValue)
      setShowHtml(false)
    } else {
      setHtmlValue(editor.getHTML())
      setShowHtml(true)
    }
  }, [editor, showHtml, htmlValue, onChange])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const wordCount = editor?.storage.characterCount?.words?.() ?? editor?.getText().split(/\s+/).filter(Boolean).length ?? 0

  const setTextColor = (color: string) => {
    if (!editor) return
    editor.chain().focus().setColor(color).run()
    setShowColor(false)
  }

  const getIsActive = (type: string, attrs?: Record<string, unknown>): boolean => {
    if (!editor) return false
    try {
      return editor.isActive(type, attrs)
    } catch {
      return false
    }
  }

  const getIsActiveAlign = (align: string): boolean => {
    if (!editor) return false
    try {
      return editor.isActive({ textAlign: align as 'left' | 'center' | 'right' | 'justify' })
    } catch {
      return false
    }
  }

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 ${
        active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )

  const getTextColor = () => {
    if (!editor) return '#000'
    try {
      return editor.getAttributes('textStyle')?.color || '#000'
    } catch {
      return '#000'
    }
  }

  const canUndo = () => {
    if (!editor) return false
    try {
      return editor.can().undo()
    } catch {
      return false
    }
  }

  const canRedo = () => {
    if (!editor) return false
    try {
      return editor.can().redo()
    } catch {
      return false
    }
  }

  const Dropdown = ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
  }) => (
    <div className="relative">
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[120px]">
          {children}
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0" onClick={onClose} />
      )}
    </div>
  )

  return (
    <div className={`border rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b items-center overflow-x-auto">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={getIsActive('bold')} title="Negrita (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={getIsActive('italic')} title="Cursiva (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={getIsActive('underline')} title="Subrayado (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={getIsActive('strike')} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={getIsActive('code')} title="Código">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={getIsActive('highlight')} title="Resaltar">
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato">
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColor(!showColor)}
            className="p-2 rounded hover:bg-gray-200 text-gray-600"
            title="Color de texto"
          >
            <span className="block w-4 h-4 rounded border" style={{ backgroundColor: getTextColor() }} />
          </button>
          <Dropdown isOpen={showColor} onClose={() => setShowColor(false)}>
            <div className="grid grid-cols-5 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTextColor(color)}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </Dropdown>
        </div>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={getIsActive('heading', { level: 1 })} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={getIsActive('heading', { level: 2 })} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={getIsActive('heading', { level: 3 })} title="Título 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={getIsActive('bulletList')} title="Lista">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={getIsActive('orderedList')} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={getIsActive('taskList')} title="Lista de tareas">
          <ListChecks className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={getIsActiveAlign('left')} title="Alinear izquierda">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={getIsActiveAlign('center')} title="Alinear centro">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={getIsActiveAlign('right')} title="Alinear derecha">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={getIsActiveAlign('justify')} title="Justificar">
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        

        <ToolbarButton onClick={setLink} active={getIsActive('link')} title="Insertar enlace">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insertar imagen">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="Insertar tabla">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={getIsActive('blockquote')} title="Cita">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea horizontal">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo()} title="Deshacer (Ctrl+Z)">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo()} title="Rehacer (Ctrl+Y)">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton onClick={toggleHtmlView} active={showHtml} title={showHtml ? "Ver editor" : "Ver HTML"}>
          {showHtml ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
        </ToolbarButton>
        <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </ToolbarButton>
      </div>

      {showHtml ? (
        <textarea
          value={htmlValue}
          onChange={(e) => setHtmlValue(e.target.value)}
          className="w-full p-4 font-mono text-sm focus:outline-none"
          placeholder="Edita el HTML aquí..."
          style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {!showHtml && (
        <div className="flex justify-between items-center px-3 py-1 bg-gray-50 border-t text-xs text-gray-500">
          <span>{wordCount} palabras</span>
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200"
            >
              <Minimize className="w-3 h-3" />
              Salir de pantalla completa
            </button>
          )}
        </div>
      )}
    </div>
  )
}