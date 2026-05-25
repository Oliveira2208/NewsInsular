'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
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
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { createClient } from '@/lib/supabase/client'
import { X, Move } from 'lucide-react'
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



async function uploadImageToSupabase(file: File | Blob, filename: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const fileExt = file.type.split('/')[1] || 'jpg'
    const uniqueName = `${filename}_${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(uniqueName, file, { contentType: file.type })
    if (error) {
      console.error('Error uploading image:', error)
      return null
    }
    const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(data.path)
    return urlData.publicUrl
  } catch (err) {
    console.error('Error uploading image:', err)
    return null
  }
}

async function fetchAndUploadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const filename = url.split('/').pop()?.split('?')[0] || 'image'
    return await uploadImageToSupabase(blob, filename)
  } catch (err) {
    console.error('Error fetching and uploading image:', err)
    return null
  }
}

export default function MarkdownEditor({ value, onChange, height = 400 }: MarkdownEditorProps) {
  const [showHtml, setShowHtml] = useState(false)
  const [htmlValue, setHtmlValue] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showColor, setShowColor] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingSrc, setUploadingSrc] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
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
          class: 'max-w-full h-auto rounded-lg cursor-pointer',
          draggable: 'true',
        },
        inline: false,
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
      TaskList,
      TaskItem.configure({
        nested: true,
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
      handleClick: (view, pos, event) => {
        if (!editor) return false
        const target = event.target as HTMLElement
        if (target.tagName === 'IMG') {
          const { left, top } = target.getBoundingClientRect()
          setImageMenuPos({ x: left + target.clientWidth / 2, y: top })
          setSelectedImage({ src: (target as HTMLImageElement).src, x: left, y: top })
          editor.commands.selectParentNode()
          return true
        }
        setSelectedImage(null)
        setImageMenuPos(null)
        return false
      },
      handleDrop: (view, event, slice, moved) => {
        if (!editor) return false
        if (!moved && event.dataTransfer?.files) {
          const files = event.dataTransfer.files
          if (files.length > 0) {
            const file = files[0]
            if (file.type.startsWith('image/')) {
              const blobUrl = URL.createObjectURL(file)
              setIsUploading(true)
              uploadImageToSupabase(file, 'editor').then((url) => {
                setIsUploading(false)
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run()
                }
              })
              return true
            }
          }
        }
        if (event.dataTransfer?.getData('text/uri-list')) {
          const uri = event.dataTransfer.getData('text/uri-list')
          if (uri.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
            setIsUploading(true)
            setUploadingSrc(uri)
            fetchAndUploadImage(uri).then((url) => {
              setIsUploading(false)
              setUploadingSrc(null)
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            })
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        if (!editor) return false
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              setIsUploading(true)
              uploadImageToSupabase(file, 'editor').then((url) => {
                setIsUploading(false)
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run()
                }
              })
              return true
            }
          }
        }
        const html = event.clipboardData?.getData('text/html')
        if (html) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const imgs = doc.querySelectorAll('img')
          if (imgs.length > 0) {
            setIsUploading(true)
            const srcs: string[] = []
            for (const img of imgs) {
              const src = img.getAttribute('src')
              if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
                srcs.push(src)
              }
            }
            Promise.all(srcs.map(fetchAndUploadImage)).then((urls) => {
              setIsUploading(false)
              urls.forEach((url, i) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url }).run()
                }
              })
            })
            return true
          }
        }
        return false
      },
    },
  })

  const safeIsActive = useCallback((type: string, attrs?: Record<string, unknown>): boolean => {
    if (!editor) return false
    try {
      return editor.isActive(type, attrs)
    } catch {
      return false
    }
  }, [editor])

  const safeCan = useCallback((action: 'undo' | 'redo'): boolean => {
    if (!editor) return false
    try {
      return action === 'undo' ? editor.can().undo() : editor.can().redo()
    } catch {
      return false
    }
  }, [editor])

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
    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url.trim() }).run()
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

  const getTextColor = () => {
    if (!editor) return '#000'
    try {
      return editor.getAttributes('textStyle')?.color || '#000'
    } catch {
      return '#000'
    }
  }

  const getIsActive = (type: string, attrs?: Record<string, unknown>): boolean => {
    return safeIsActive(type, attrs)
  }

const getIsActiveAlign = (align: string): boolean => {
    return safeIsActive('paragraph', { textAlign: align as 'left' | 'center' | 'right' | 'justify' })
  }

  const canUndo = () => safeCan('undo')
  const canRedo = () => safeCan('redo')

  const deleteImage = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteSelection().run()
    setSelectedImage(null)
    setImageMenuPos(null)
  }, [editor])

  const [selectedImage, setSelectedImage] = useState<{ src: string; x: number; y: number } | null>(null)
  const [imageMenuPos, setImageMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'IMG') {
          setSelectedImage(null)
          setImageMenuPos(null)
        }
      }
    }
    if (selectedImage) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedImage])

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
        <div className="relative">
          <EditorContent editor={editor} />
          {selectedImage && (
            <div
              ref={menuRef}
              className="fixed bg-white rounded-lg shadow-lg border p-2 z-50 flex items-center gap-2"
              style={{ 
                left: `${imageMenuPos?.x ?? 0}px`, 
                top: `${imageMenuPos?.y ?? 0}px`,
                transform: 'translateX(-50%) translateY(-120%)'
              }}
            >
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Move className="w-3 h-3" />
                Arrastra para mover
              </span>
              <button
                type="button"
                onClick={deleteImage}
                className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-600">Subiendo imagen...</span>
                {uploadingSrc && uploadingSrc.startsWith('http') && (
                  <span className="text-xs text-gray-400 max-w-[200px] truncate">{uploadingSrc}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!showHtml && (
        <div className="flex justify-between items-center px-3 py-1 bg-gray-50 border-t text-xs text-gray-500 z-10 relative">
          <div className="flex items-center gap-2">
            <span>{wordCount} palabras</span>
            {isUploading && (
              <span className="flex items-center gap-1 text-blue-600">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Subiendo imagen...
              </span>
            )}
          </div>
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

      <style jsx global>{`
        .ProseMirror h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; color: #1a1a1a; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; color: #1a1a1a; }
        .ProseMirror h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; color: #1a1a1a; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .ProseMirror table td, .ProseMirror table th { border: 1px solid #ddd; padding: 8px; }
        .ProseMirror table th { background-color: #f5f5f5; font-weight: bold; }
        .ProseMirror blockquote { border-left: 3px solid #ccc; margin: 1em 0; padding-left: 1em; color: #666; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
        .ProseMirror ul[data-type="taskList"] li input { margin-top: 0.4em; }
        .ProseMirror hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
        .ProseMirror code { background-color: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
        .ProseMirror pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
        .ProseMirror pre code { background: none; padding: 0; }
        .ProseMirror mark { background-color: #ffff00; padding: 0.1em 0.2em; }
        .ProseMirror mark[data-color] { padding: 0.1em 0.2em; }
        .ProseMirror img { cursor: pointer; transition: outline 0.2s; }
        .ProseMirror img.ProseMirror-selectednode { outline: 2px solid #3b82f6; }
        .ProseMirror .image-node-wrapper { position: relative; display: inline-block; width: 100%; }
        .ProseMirror .image-node-wrapper::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 6px; height: 24px; background: #3b82f6; border-radius: 3px; cursor: grab; opacity: 0; transition: opacity 0.2s; }
        .ProseMirror .image-node-wrapper:hover::before { opacity: 1; }
        .ProseMirror img[data-drag-handle] { cursor: grab; }
        .ProseMirror img[data-drag-handle]:active { cursor: grabbing; }
        .ProseMirror .ProseMirror-selectednode[data-drag-handle] { cursor: grabbing; }
      `}</style>
    </div>
  )
}