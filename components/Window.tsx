'use client'

import { motion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'

interface WindowProps {
  id: string
  title: string
  children: ReactNode
  onClose: () => void
  iconAreaWidth?: number
}

export default function Window({ id, title, children, onClose, iconAreaWidth = 0 }: WindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateWindowDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setWindowSize({ width, height })
      setIsMobile(width <= 768)

      // Pencere konumunu güncelle
      if (width <= 768) {
        setPosition({ x: 0, y: 0 })
      } else {
        // İkon alanını dikkate alarak rastgele konum belirle
        const availableWidth = width - iconAreaWidth - 500 // Pencere genişliğini çıkar
        const availableHeight = height - 400 // Pencere yüksekliğini çıkar
        
        // Minimum konum ikonların olduğu alanın dışında olmalı
        const minX = iconAreaWidth
        // Rastgele konum ama ekranın ortalarında olacak şekilde
        const randomX = Math.floor(Math.random() * (availableWidth * 0.6)) + minX
        const randomY = Math.floor(Math.random() * (availableHeight * 0.6))
        
        setPosition({ 
          x: Math.max(minX, Math.min(randomX, width - 500)),
          y: Math.max(0, Math.min(randomY, height - 400))
        })
      }
    }

    updateWindowDimensions()
    window.addEventListener('resize', updateWindowDimensions)
    return () => window.removeEventListener('resize', updateWindowDimensions)
  }, [iconAreaWidth])

  const handleDragStart = () => setIsDragging(true)
  const handleDragEnd = () => {
    setIsDragging(false)
    // Sürükleme sonrası pencereyi ekran sınırları içinde tut ve ikon alanının dışında tut
    const newX = Math.max(iconAreaWidth, Math.min(position.x, windowSize.width - 500))
    const newY = Math.max(0, Math.min(position.y, windowSize.height - 400))
    setPosition({ x: newX, y: newY })
  }

  return (
    <motion.div
      className={`fixed bg-black/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] 
        border-2 border-cyan-500/30 rounded-lg overflow-hidden
        ${isMobile ? 'w-full h-[calc(100%-3.5rem)] bottom-14' : 'w-[500px] h-[400px]'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
      drag={!isMobile}
      dragMomentum={false}
      dragConstraints={{
        top: 0,
        left: iconAreaWidth, // İkon alanının dışında başla
        right: Math.max(0, windowSize.width - 500),
        bottom: Math.max(0, windowSize.height - 400)
      }}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={!isMobile ? { 
        x: position.x, 
        y: position.y,
        zIndex: isDragging ? 30 : 20 
      } : undefined}
    >
      <div className="p-3 bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border-b-2 border-cyan-500/30 
        flex justify-between items-center backdrop-blur-md">
        <div className="font-cyber text-cyan-400 text-sm tracking-wider">{title}</div>
        <button 
          onClick={onClose}
          className="text-cyan-400 hover:text-pink-400 transition-colors p-1 hover:bg-white/5 rounded"
        >
          <IoClose size={20} />
        </button>
      </div>
      <div className="h-[calc(100%-3rem)] overflow-auto p-4 scrollbar-thin scrollbar-track-black/20 
        scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/40">
        {children}
      </div>
    </motion.div>
  )
}