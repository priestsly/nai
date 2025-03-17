// components/WindowManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'

interface WindowProps {
  id: string
  title: string
  content: React.ReactNode
  position: { x: number; y: number }
}

export default function WindowManager() {
  const [windows, setWindows] = useState<WindowProps[]>([])
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const openWindow = (id: string, title: string, content: React.ReactNode) => {
    if (!windows.some(window => window.id === id)) {
      setWindows(prev => [
        ...prev,
        {
          id,
          title,
          content,
          position: {
            x: Math.random() * (window.innerWidth - 400),
            y: Math.random() * (window.innerHeight - 300)
          }
        }
      ])
    }
  }

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(window => window.id !== id))
  }

  const bringToFront = (id: string) => {
    setWindows(prev => {
      const window = prev.find(w => w.id === id)
      return window 
        ? [...prev.filter(w => w.id !== id), window] 
        : prev
    })
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence>
        {windows.map((window, index) => (
          <motion.div
            key={window.id}
            className="absolute w-[500px] h-[400px] bg-cyber-dark/90 backdrop-blur-lg border-2 border-cyber-primary/30 rounded-lg shadow-2xl overflow-hidden"
            style={{
              zIndex: index + 1,
              left: window.position.x,
              top: window.position.y
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={(e, info) => {
              setDragOffset({
                x: info.point.x - window.position.x,
                y: info.point.y - window.position.y
              })
              bringToFront(window.id)
            }}
            onDragEnd={(e, info) => {
              setWindows(prev =>
                prev.map(w =>
                  w.id === window.id
                    ? {
                        ...w,
                        position: {
                          x: info.point.x - dragOffset.x,
                          y: info.point.y - dragOffset.y
                        }
                      }
                    : w
                )
              )
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-cyber-primary/30 bg-cyber-dark/80">
              <h2 className="font-orbitron text-cyber-primary">{window.title}</h2>
              <button
                onClick={() => closeWindow(window.id)}
                className="text-cyber-primary hover:text-cyber-secondary transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)] overflow-auto p-4">
              {window.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}