// pages/index.jsx
'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { FaPowerOff, FaRegClock, FaDesktop, FaFolder, FaTerminal, FaRobot, FaGamepad, FaDove, FaWallet, FaCopy, FaExchangeAlt, FaShieldAlt, FaKey, FaGlobe, FaRunning, FaShareAlt } from 'react-icons/fa'
import dynamic from 'next/dynamic'

// Dinamik bileşenler
const StartMenu = dynamic(() => import('@/components/StartMenu'), { ssr: false })
const AIChat = dynamic(() => import('@/components/AIChat'), { ssr: false })
const NeuralPong = dynamic(() => import('@/components/NeuralPong'), { ssr: false })
const NeuralBird = dynamic(() => import('@/components/NeuralBird'), { ssr: false })
const NeuralRunner = dynamic(() => import('@/components/NeuralRunner'), { ssr: false })
const WebBrowser = dynamic(() => import('@/components/WebBrowser'), { ssr: false })
const FileShare = dynamic(() => import('@/components/FileShare'), { ssr: false })

import Window from '@/components/Window'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface DesktopIcon {
  id: string
  title: string
  icon: React.ReactNode
  action: string
}

const CryptoAddress = ({ address }: { address: string }) => {
  const [displayAddress, setDisplayAddress] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= address.length) {
        setDisplayAddress(address.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [address])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="font-mono bg-black/30 p-2 rounded-lg">
        <div className="text-purple-300 break-all">
          {displayAddress}
          {displayAddress.length < address.length && (
            <span className="animate-pulse text-cyan-400">_</span>
          )}
        </div>
      </div>
      <button
        onClick={copyToClipboard}
        className="w-full py-1.5 px-3 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg border border-purple-500/30 transition-all flex items-center justify-center gap-2 text-sm"
      >
        <FaCopy className={isCopied ? 'text-green-400' : 'text-purple-400'} />
        <span>{isCopied ? 'Copied!' : 'Copy Neural ID'}</span>
      </button>
    </div>
  )
}

export default function Home() {
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [isBooting, setIsBooting] = useState(false)
  const [windows, setWindows] = useState<string[]>([])
  const [showStartMenu, setShowStartMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeWindow, setActiveWindow] = useState<'chat' | 'game' | 'bird' | 'runner' | 'browser' | 'fileshare' | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [solBalance, setSolBalance] = useState<number | null>(null)

  useEffect(() => {
    setIsMounted(true)
    checkIfWalletIsConnected()
  }, [])

  const getPhantomWallet = () => {
    if (typeof window !== 'undefined') {
      const { solana } = window as any
      if (solana?.isPhantom) {
        return solana
      }
    }
    return null
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const phantom = getPhantomWallet()
      if (!phantom) {
        setWalletError('Please install Phantom Wallet')
        return
      }
      const { publicKey } = phantom
      if (publicKey) {
        setWalletAddress(publicKey.toString())
      }
    } catch (error) {
      console.error(error)
      setWalletError('Error checking wallet connection')
    }
  }

  const getBalance = async () => {
    try {
      const phantom = getPhantomWallet()
      if (!phantom || !walletAddress) return

      const connection = new (window as any).solanaWeb3.Connection(
        'https://api.devnet.solana.com',
        'confirmed'
      )
      
      const publicKey = new (window as any).solanaWeb3.PublicKey(walletAddress)
      const balance = await connection.getBalance(publicKey)
      console.log('Balance fetched:', balance)
      setSolBalance(balance / (10 ** 9))
    } catch (error) {
      console.error('Error fetching balance:', error)
      setWalletError('Error fetching balance')
    }
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const updateBalance = async () => {
      if (walletAddress) {
        await getBalance()
      }
    }

    updateBalance()
    intervalId = setInterval(updateBalance, 5000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [walletAddress])

  const connectWallet = async () => {
    try {
      setWalletError(null)
      const phantom = getPhantomWallet()
      
      if (!phantom) {
        window.open('https://phantom.app/', '_blank')
        setWalletError('Please install Phantom Wallet')
        return
      }

      const { publicKey } = await phantom.connect()
      setWalletAddress(publicKey.toString())
      await getBalance()
    } catch (error) {
      console.error(error)
      setWalletError('Error connecting wallet')
    }
  }

  const bootComputer = () => {
    setIsPoweredOn(true)
    setIsBooting(true)
    setTimeout(() => setIsBooting(false), 3000)
  }

  const desktopIcons: DesktopIcon[] = [
    {
      id: 'my-computer',
      title: 'My Computer',
      icon: <FaDesktop className="text-3xl text-cyan-500" />,
      action: 'my-computer'
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: <FaFolder className="text-3xl text-pink-500" />,
      action: 'documents'
    },
    {
      id: 'ai-chat',
      title: 'Neural Link',
      icon: <FaRobot className="text-3xl text-cyan-500" />,
      action: 'chat'
    },
    {
      id: 'neural-pong',
      title: 'Neural Pong',
      icon: <FaGamepad className="text-3xl text-fuchsia-500" />,
      action: 'game'
    },
    {
      id: 'neural-bird',
      title: 'Neural Bird',
      icon: <FaDove className="text-3xl text-cyan-500" />,
      action: 'bird'
    },
    {
      id: 'neural-runner',
      title: 'Neural Runner',
      icon: <FaRunning className="text-3xl text-green-500" />,
      action: 'runner'
    },
    {
      id: 'phantom-wallet',
      title: 'Phantom Wallet',
      icon: <FaWallet className="text-3xl text-purple-500" />,
      action: 'wallet'
    },
    {
      id: 'web-browser',
      title: 'Neural Browser',
      icon: <FaGlobe className="text-3xl text-cyan-500" />,
      action: 'browser'
    },
    {
      id: 'file-share',
      title: 'Neural Share',
      icon: <FaShareAlt className="text-3xl text-amber-500" />,
      action: 'fileshare'
    }
  ]

  const openWindow = (id: string) => {
    if (id === 'wallet') {
      if (walletAddress) {
        if (!windows.includes('wallet-info')) {
          setWindows(prev => [...prev, 'wallet-info'])
        }
      } else {
        connectWallet()
      }
    } else if (id === 'chat' || id === 'game' || id === 'bird' || id === 'runner' || id === 'browser' || id === 'fileshare') {
      setActiveWindow(id)
      setWindows([])
    } else {
      if (!windows.includes(id)) {
        setWindows(prev => [...prev, id])
      }
    }
  }

  const closeWindow = (id: string) => {
    if (id === 'chat' || id === 'game' || id === 'bird' || id === 'runner' || id === 'browser' || id === 'fileshare') {
      setActiveWindow(null)
    } else {
      setWindows(prev => prev.filter(windowId => windowId !== id))
    }
  }

  if (!isMounted) return null

  if (!isPoweredOn) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <button 
          onClick={bootComputer}
          className="text-4xl text-cyan-500 animate-pulse"
        >
          <FaPowerOff />
        </button>
      </div>
    )
  }

  if (isBooting) {
    return (
      <div className="w-screen h-screen bg-black text-cyan-500 flex items-center justify-center">
        <div className="text-4xl font-mono animate-pulse">INITIALIZING OS...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      {walletError && (
        <div className="fixed top-4 right-4 bg-red-900/80 text-white px-4 py-2 rounded-md border border-red-500 z-50">
          {walletError}
        </div>
      )}
      
      {/* Arka plan efekti */}
      <div className="absolute inset-0 bg-[url('/matrix.png')] opacity-10 pointer-events-none" />
      
      {/* Masaüstü Alanı */}
      <div className="absolute inset-0 bottom-14">
        {/* Masaüstü İkonları */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-6 p-6">
          {desktopIcons.map(icon => (
            <div
              key={icon.id}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => openWindow(icon.action)}
            >
              <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-lg border-2 border-cyan-500 group-hover:border-pink-500 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,255,0.3)] group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                {icon.icon}
              </div>
              <span className="text-xs text-center text-cyan-400 group-hover:text-pink-400 font-cyber">
                {icon.title}
              </span>
            </div>
          ))}
        </div>

        {/* Pencereler */}
        <AnimatePresence>
          {windows.map(windowId => (
            <Window
              key={windowId}
              id={windowId}
              title={windowId === 'wallet-info' ? 'Wallet Info' : windowId.replace('-', ' ').toUpperCase()}
              onClose={() => closeWindow(windowId)}
            >
              {windowId === 'wallet-info' && walletAddress && (
                <div className="p-4 space-y-4 bg-black/20 backdrop-blur-sm rounded-lg">
                  {/* Wallet Info İçeriği */}
                  <div className="relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <FaWallet className="text-2xl text-purple-400" />
                        <h2 className="text-xl font-cyber text-purple-300">Neural Wallet v2.3</h2>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-purple-400 font-cyber text-sm">Neural ID:</h3>
                          <FaKey className="text-purple-400" />
                        </div>
                        <CryptoAddress address={walletAddress} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-cyan-400 font-cyber text-sm">Balance:</h3>
                            <FaExchangeAlt className="text-cyan-400" />
                          </div>
                          <div className="font-mono text-xl text-cyan-300">
                            {solBalance !== null ? (
                              <div>{solBalance.toFixed(4)} SOL</div>
                            ) : (
                              <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-pink-900/10 p-4 rounded-lg border border-pink-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-pink-400 font-cyber text-sm">Network:</h3>
                            <FaShieldAlt className="text-pink-400" />
                          </div>
                          <div className="font-cyber text-pink-300">Devnet</div>
                          <div className="text-xs text-pink-400/50 mt-1">Secure Connection</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setWalletAddress(null)
                          setSolBalance(null)
                          closeWindow('wallet-info')
                        }}
                        className="w-full py-3 bg-red-900/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-900/40 transition-all group flex items-center justify-center gap-2"
                      >
                        <span>Disconnect Neural Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {windowId === 'my-computer' && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 hover:bg-cyan-900/20 rounded-lg border border-cyan-500/30 transition-all duration-300">
                    <FaDesktop className="text-4xl text-cyan-500 mb-2" />
                    <span className="text-cyan-400">Neural Core (C:)</span>
                  </div>
                  <div className="flex flex-col items-center p-4 hover:bg-pink-900/20 rounded-lg border border-pink-500/30 transition-all duration-300">
                    <FaFolder className="text-4xl text-pink-500 mb-2" />
                    <span className="text-pink-400">Neural Data</span>
                  </div>
                </div>
              )}
              {windowId === 'documents' && (
                <div className="p-4">
                  <h2 className="text-xl text-cyan-400 mb-4 font-cyber">Neural Data</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 hover:bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                      <FaFolder className="text-cyan-500" />
                      <span className="text-cyan-400">Secret Files</span>
                    </div>
                  </div>
                </div>
              )}
            </Window>
          ))}
        </AnimatePresence>

        {/* Tam ekran uygulamalar */}
        {activeWindow && (
          <div className="fixed inset-0 bg-black z-50">
            <div className="flex items-center justify-between p-4 bg-black/60 border-b border-green-500/30">
              <div className="flex items-center gap-2">
                {activeWindow === 'chat' ? (
                  <FaRobot className="text-cyan-500" />
                ) : activeWindow === 'game' ? (
                  <FaGamepad className="text-fuchsia-500" />
                ) : activeWindow === 'bird' ? (
                  <FaDove className="text-cyan-500" />
                ) : activeWindow === 'runner' ? (
                  <FaRunning className="text-green-500" />
                ) : activeWindow === 'fileshare' ? (
                  <FaShareAlt className="text-amber-500" />
                ) : (
                  <FaGlobe className="text-cyan-500" />
                )}
                <span className="text-white font-cyber">
                  {activeWindow === 'chat'
                    ? 'Neural Link'
                    : activeWindow === 'game'
                    ? 'Neural Pong'
                    : activeWindow === 'bird'
                    ? 'Neural Bird'
                    : activeWindow === 'runner'
                    ? 'Neural Runner'
                    : activeWindow === 'fileshare'
                    ? 'Neural Share'
                    : 'Neural Browser'}
                </span>
              </div>
              <button
                onClick={() => closeWindow(activeWindow)}
                className="text-red-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden">
              {activeWindow === 'chat' ? <AIChat /> : 
               activeWindow === 'game' ? <NeuralPong /> : 
               activeWindow === 'bird' ? <NeuralBird /> : 
               activeWindow === 'runner' ? <NeuralRunner /> : 
               activeWindow === 'fileshare' ? <FileShare /> : 
               <WebBrowser />}
            </div>
          </div>
        )}
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 w-full h-14 bg-black/80 backdrop-blur-xl flex items-center px-6 justify-between border-t border-cyan-500/30 shadow-[0_-5px_15px_rgba(0,255,255,0.1)] z-50">
        <button
          className="px-4 h-10 bg-cyan-950/30 border border-cyan-500/50 flex items-center gap-2 hover:bg-cyan-900/40 transition-all duration-300 rounded-md"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <FaTerminal className="text-cyan-400" />
          <span className="text-cyan-400 text-sm font-cyber">Neural Link</span>
        </button>
        
        <div className="flex items-center gap-4">
          {walletAddress && (
            <div className="flex items-center gap-2 text-purple-400 bg-black/40 px-3 py-1 rounded-md border border-purple-500/30">
              <FaWallet className="text-purple-500" />
              <span className="font-cyber">{`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-cyan-400 bg-black/40 px-3 py-1 rounded-md border border-cyan-500/30">
            <FaRegClock className="text-cyan-500" />
            <span className="font-cyber">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {showStartMenu && (
          <StartMenu 
            onClose={() => setShowStartMenu(false)}
            onOpenWindow={openWindow}
          />
        )}
      </div>
    </div>
  )
}
