'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileItem {
  _id: string; name: string; size: number
  mimeType: string; folderId: string | null
  isChunked: boolean; createdAt: string
}

interface FileViewerProps {
  file: FileItem | null
  files: FileItem[]
  onClose: () => void
}

export function canPreview(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('xml')
  )
}

function getViewerType(mimeType: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unsupported' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('xml')) return 'text'
  return 'unsupported'
}

export function FileViewer({ file, files, onClose }: FileViewerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileItem | null>(file)

  useEffect(() => {
    setCurrentFile(file)
    setZoom(1)
    setRotation(0)
    setTextContent(null)
    setObjectUrl(null)
  }, [file])

  const previewableFiles = files.filter(f => canPreview(f.mimeType))
  const currentIdx = previewableFiles.findIndex(f => f._id === currentFile?._id)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < previewableFiles.length - 1

  const goNext = () => {
    if (hasNext) {
      setCurrentFile(previewableFiles[currentIdx + 1])
      setZoom(1); setRotation(0); setTextContent(null)
    }
  }
  const goPrev = () => {
    if (hasPrev) {
      setCurrentFile(previewableFiles[currentIdx - 1])
      setZoom(1); setRotation(0); setTextContent(null)
    }
  }

  useEffect(() => {
    if (!currentFile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4))
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25))
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile, currentIdx])

  useEffect(() => {
    if (!currentFile) return
    const viewerType = getViewerType(currentFile.mimeType)

    let active = true
    if (viewerType === 'text') {
      setLoadingText(true)
      fetch(`/api/download?fileId=${currentFile._id}`)
        .then(r => r.text())
        .then(t => { if (active) { setTextContent(t); setLoadingText(false) } })
        .catch(() => { if (active) { setTextContent('Failed to load text content.'); setLoadingText(false) } })
    } else if (viewerType === 'image') {
      setLoadingText(true)
      fetch(`/api/download?fileId=${currentFile._id}`)
        .then(r => r.blob())
        .then(b => {
          if (active) {
            const url = URL.createObjectURL(b)
            setObjectUrl(url)
            setLoadingText(false)
          }
        })
        .catch(() => { if (active) setLoadingText(false) })
    }

    return () => { active = false }
  }, [currentFile])

  if (!currentFile) return null

  const viewerType = getViewerType(currentFile.mimeType)
  const downloadUrl = `/api/download?fileId=${currentFile._id}`
  const isImage = viewerType === 'image'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={overlayRef}
      onClick={(e: any) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* Toolbar */}
      <div className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-6 shadow-lg" style={{ background: '#ffffff', borderBottom: '2px solid #e5e5e5' }}>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="p-2 rounded-xl transition-colors"
            style={{ color: hasPrev ? '#777777' : '#e5e5e5', cursor: hasPrev ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (hasPrev) { (e.currentTarget as HTMLButtonElement).style.color = '#58cc02'; (e.currentTarget as HTMLButtonElement).style.background = '#f7fff0' } }}
            onMouseLeave={e => { if (hasPrev) { (e.currentTarget as HTMLButtonElement).style.color = '#777777'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}
            title="Previous (←)"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="p-2 rounded-xl transition-colors"
            style={{ color: hasNext ? '#777777' : '#e5e5e5', cursor: hasNext ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (hasNext) { (e.currentTarget as HTMLButtonElement).style.color = '#58cc02'; (e.currentTarget as HTMLButtonElement).style.background = '#f7fff0' } }}
            onMouseLeave={e => { if (hasNext) { (e.currentTarget as HTMLButtonElement).style.color = '#777777'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}
            title="Next (→)"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
          <span className="font-heading truncate" style={{ color: '#3c3c3c', fontSize: '1rem' }}>{currentFile.name}</span>
          {previewableFiles.length > 1 && (
            <span style={{ fontSize: '0.75rem', color: '#58cc02', fontWeight: 700 }}>
              File {currentIdx + 1} of {previewableFiles.length}
            </span>
          )}
        </div>

        {isImage && (
          <div className="hidden md:flex items-center gap-1 mr-4 rounded-xl p-1" style={{ background: '#f7f7f7', border: '2px solid #e5e5e5' }}>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: '#777777' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#58cc02' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#777777' }}
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="font-mono text-xs w-12 text-center select-none" style={{ color: '#3c3c3c' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: '#777777' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#58cc02' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#777777' }}
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 mx-1" style={{ background: '#e5e5e5' }} />
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: '#777777' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#58cc02' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#777777' }}
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors"
            style={{ background: '#d7ffb8', color: '#3f8f01', border: '2px solid #58cc02' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#58cc02'; (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#d7ffb8'; (e.currentTarget as HTMLAnchorElement).style.color = '#3f8f01' }}
          >
            <Download size={16} />
            <span>Download</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#afafaf' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#cc348d'; (e.currentTarget as HTMLButtonElement).style.background = '#fff0f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#afafaf'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFile._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full h-full flex items-center justify-center"
          >
            {viewerType === 'image' && (
              loadingText ? (
                <div className="flex h-full items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: '#e5e5e5', borderTopColor: '#58cc02' }} />
                </div>
              ) : objectUrl ? (
                <img
                  src={objectUrl}
                  alt={currentFile.name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
                  }}
                  onClick={() => setZoom(z => z > 1 ? 1 : 2)}
                  draggable={false}
                />
              ) : (
                <div style={{ color: '#afafaf' }}>Failed to load image</div>
              )
            )}

            {viewerType === 'video' && (
              <video
                src={downloadUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-2xl shadow-2xl"
                style={{ background: '#000' }}
              />
            )}

            {viewerType === 'audio' && (
              <div className="w-full max-w-md p-8 rounded-3xl flex flex-col items-center" style={{ background: '#ffffff', border: '2px solid #e5e5e5' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl animate-[spin_4s_linear_infinite]" style={{ background: '#58cc02' }}>
                  <div className="w-8 h-8 rounded-full" style={{ background: '#ffffff' }} />
                </div>
                <h3 className="text-xl font-bold mb-8 text-center" style={{ color: '#3c3c3c' }}>{currentFile.name}</h3>
                <audio src={downloadUrl} controls autoPlay className="w-full" />
              </div>
            )}

            {viewerType === 'pdf' && (
              <iframe
                src={`${downloadUrl}#toolbar=1`}
                title={currentFile.name}
                className="w-full h-full max-w-5xl rounded-2xl shadow-2xl"
                style={{ background: '#f7f7f7' }}
              />
            )}

            {viewerType === 'text' && (
              <div className="w-full h-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: '#f7f7f7', border: '2px solid #e5e5e5' }}>
                <div className="h-10 flex items-center px-4 shrink-0" style={{ background: '#efefef', borderBottom: '2px solid #e5e5e5' }}>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="ml-4 text-xs font-mono" style={{ color: '#afafaf' }}>{currentFile.name}</span>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {loadingText ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-4 animate-spin" style={{ borderColor: '#e5e5e5', borderTopColor: '#58cc02' }} />
                    </div>
                  ) : (
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#3c3c3c' }}>
                      {textContent}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {viewerType === 'unsupported' && (
              <div className="flex flex-col items-center p-12 rounded-3xl text-center max-w-md" style={{ background: '#ffffff', border: '2px solid #e5e5e5' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#f7f7f7' }}>
                  <FileQuestion size={40} style={{ color: '#afafaf' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#3c3c3c' }}>No Preview Available</h3>
                <p className="text-sm mb-8" style={{ color: '#777777' }}>{currentFile.mimeType}</p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full px-6 py-3 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Download to view
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
