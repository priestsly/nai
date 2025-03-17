'use client'

import { FaPowerOff, FaFolder, FaDesktop } from 'react-icons/fa'

interface StartMenuProps {
  onClose: () => void
  onOpenWindow: (id: string) => void
}

export default function StartMenu({ onClose, onOpenWindow }: StartMenuProps) {
  return (
    <div className="fixed bottom-14 left-2 bg-black/95 backdrop-blur-lg w-64 shadow-xl border-2 border-cyan-500/20 rounded-lg z-50 max-h-[calc(100vh-5rem)] overflow-auto">
      <div className="p-4 border-b-2 border-cyber-primary/20 text-cyber-primary font-orbitron">
        NEUROGRID v2.3.1
      </div>
      
      <button 
        className="w-full p-3 hover:bg-cyber-primary/10 flex items-center gap-3 text-cyber-secondary"
        onClick={() => {
          onOpenWindow('my-computer')
          onClose()
        }}
      >
        <FaDesktop className="text-cyber-primary" />
        My Computer
      </button>

      <button 
        className="w-full p-3 hover:bg-cyber-primary/10 flex items-center gap-3 text-cyber-secondary"
        onClick={() => {
          onOpenWindow('documents')
          onClose()
        }}
      >
        <FaFolder className="text-cyber-primary" />
        Documents
      </button>

      <div className="border-t-2 border-cyber-primary/20 mt-2 pt-2">
        <button 
          className="w-full p-3 hover:bg-red-600/20 flex items-center gap-3 text-cyber-secondary"
          onClick={onClose}
        >
          <FaPowerOff className="text-red-500" />
          Shutdown
        </button>
      </div>
    </div>
  )
}