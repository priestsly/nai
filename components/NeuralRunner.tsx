declare global {
  interface Window {
    solana?: any;
  }
}


'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Connection, clusterApiUrl, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'

const PLAYER_WIDTH = 30
const PLAYER_HEIGHT = 50
const GRAVITY = 0.8
const JUMP_FORCE = -15
const GAME_SPEED = 5

interface Obstacle {
  x: number
  width: number
  height: number
  type: 'low' | 'high'
}

interface EnergyParticle {
  x: number
  y: number
  collected: boolean
}

const NeuralRunner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<number>(0)
  
  // Game state
  const playerYRef = useRef(0)
  const playerVelocityRef = useRef(0)
  const obstaclesRef = useRef<Obstacle[]>([])
  const particlesRef = useRef<EnergyParticle[]>([])
  const distanceRef = useRef(0)
  const gameSpeedRef = useRef(GAME_SPEED)
  
  // Eklenen: Zıplama sayısı (jump count)
  const jumpCountRef = useRef(0)
  
  // Scores
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // AI mode
  const [aiMode, setAiMode] = useState(false)
  const [aiThoughts, setAiThoughts] = useState<string>("")
  const lastDecisionTime = useRef(0)
  
  // AI Learning: dynamic jump threshold (in pixels)
  const aiJumpThresholdRef = useRef(200) // initial threshold is 200px
  const aiLearningUpdatedRef = useRef(false)
  
  // Audio
  const audioContextRef = useRef<AudioContext | null>(null)

  // Solana Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) return
    
    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
    
    oscillator.start()
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }, [])
  
  const addObstacle = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Obstacles can be 'low' or 'high'
    const type: 'low' | 'high' = Math.random() > 0.5 ? 'low' : 'high'
    const width = 30
    const height = type === 'low' ? 30 : 60
    
    obstaclesRef.current.push({
      x: canvas.width,
      width,
      height,
      type
    })
  }, [])
  
  const addEnergyParticle = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    particlesRef.current.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 100) + 50,
      collected: false
    })
  }, [])
  
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Reset game state
    playerYRef.current = canvas.height - PLAYER_HEIGHT
    playerVelocityRef.current = 0
    obstaclesRef.current = []
    particlesRef.current = []
    distanceRef.current = 0
    gameSpeedRef.current = GAME_SPEED
    aiLearningUpdatedRef.current = false // reset learning flag on new game
    jumpCountRef.current = 0  // sıfırla
    
    setIsPlaying(true)
    setScore(0)
    
    // Update best score if needed
    setBestScore(prev => score > prev ? score : prev)
    
    // Initialize audio
    audioContextRef.current = new (window.AudioContext || window.AudioContext)()
    
    // Add initial obstacle
    addObstacle()
  }, [addObstacle, score])
  
  const jump = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Only jump if on the ground
    if (playerYRef.current < canvas.height - PLAYER_HEIGHT) return

    // Artan: Zıplama sayısını arttır
    jumpCountRef.current++
    
    playerVelocityRef.current = JUMP_FORCE
    playSound(400, 0.1)
  }, [playSound])
  
  // AI decision making: jump if the obstacle is within the current jump threshold.
  const makeAiDecision = useCallback(() => {
    if (!isPlaying || !aiMode) return
    
    const now = Date.now()
    if (now - lastDecisionTime.current < 50) return // check every 50ms
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const nearestObstacle = obstaclesRef.current[0]
    if (!nearestObstacle) return
    
    const distanceToObstacle = nearestObstacle.x - 50
    const thoughts: string[] = []
    
    if (distanceToObstacle < aiJumpThresholdRef.current) {
      thoughts.push("Obstacle approaching!")
      thoughts.push("Jump required!")
      jump()
    }
    
    thoughts.push(`Jump Threshold: ${Math.round(aiJumpThresholdRef.current)}px`)
    thoughts.push(`Obstacle Distance: ${Math.round(distanceToObstacle)}px`)
    thoughts.push(`Speed: ${Math.round(gameSpeedRef.current * 10) / 10}`)
    
    setAiThoughts(thoughts.join("\n"))
    
    lastDecisionTime.current = now
  }, [isPlaying, aiMode, jump])
  
  // AI control loop
  useEffect(() => {
    if (!aiMode || !isPlaying) return
    
    const aiControl = setInterval(() => {
      makeAiDecision()
    }, 50)
    
    return () => clearInterval(aiControl)
  }, [aiMode, isPlaying, makeAiDecision])
  
  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Canvas sizing
    const updateCanvasSize = () => {
      const maxWidth = Math.min(800, window.innerWidth - 32)
      const maxHeight = Math.min(400, window.innerHeight - 100)
      
      canvas.width = maxWidth
      canvas.height = maxHeight
      
      playerYRef.current = canvas.height - PLAYER_HEIGHT
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    const gameLoop = () => {
      if (!isPlaying) return
      
      // Update player physics
      playerVelocityRef.current += GRAVITY
      playerYRef.current = Math.min(
        canvas.height - PLAYER_HEIGHT,
        playerYRef.current + playerVelocityRef.current
      )
      
      // Update obstacles
      obstaclesRef.current.forEach(obstacle => {
        obstacle.x -= gameSpeedRef.current
      })
      obstaclesRef.current = obstaclesRef.current.filter(obstacle => obstacle.x > -obstacle.width)
      if (obstaclesRef.current.length === 0 || 
          obstaclesRef.current[obstaclesRef.current.length - 1].x < canvas.width - 300) {
        addObstacle()
      }
      
      // Update energy particles
      particlesRef.current.forEach(particle => {
        particle.x -= gameSpeedRef.current
      })
      particlesRef.current = particlesRef.current.filter(particle => particle.x > 0)
      if (Math.random() < 0.02) {
        addEnergyParticle()
      }
      
      // Collision detection using AABB
      const playerRect = {
        x: 50,
        y: playerYRef.current,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT
      }
      
      for (const obstacle of obstaclesRef.current) {
        const obstacleRect = {
          x: obstacle.x,
          y: canvas.height - obstacle.height,
          width: obstacle.width,
          height: obstacle.height
        }
        if (
          playerRect.x < obstacleRect.x + obstacleRect.width &&
          playerRect.x + playerRect.width > obstacleRect.x &&
          playerRect.y < obstacleRect.y + obstacleRect.height &&
          playerRect.y + playerRect.height > obstacleRect.y
        ) {
          // AI Learning: adjust jump threshold based on collision
          if (aiMode && !aiLearningUpdatedRef.current) {
            const collisionDistance = obstacle.x - 50
            const learningRate = 0.2
            const targetThreshold = collisionDistance + 50
            aiJumpThresholdRef.current = Math.round(
              (1 - learningRate) * aiJumpThresholdRef.current + learningRate * targetThreshold
            )
            aiLearningUpdatedRef.current = true
          }
          setIsPlaying(false)
          playSound(200, 0.3)
          return
        }
      }
      
      // Energy particle collection
      for (const particle of particlesRef.current) {
        if (!particle.collected &&
            Math.abs(playerRect.x - particle.x) < 30 &&
            Math.abs((playerRect.y + playerRect.height / 2) - particle.y) < 30) {
          particle.collected = true
          setScore(s => s + 10)
          playSound(600, 0.1)
        }
      }
      
      // Increase distance and difficulty
      distanceRef.current += gameSpeedRef.current
      if (distanceRef.current % 1000 < gameSpeedRef.current) {
        gameSpeedRef.current += 0.1
      }
      
      // Drawing
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw grid background
      ctx.strokeStyle = '#0f0'
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.1
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      
      // Draw player
      ctx.fillStyle = '#0ff'
      ctx.fillRect(50, playerYRef.current, PLAYER_WIDTH, PLAYER_HEIGHT)
      
      // Draw obstacles
      ctx.fillStyle = '#f0f'
      obstaclesRef.current.forEach(obstacle => {
        ctx.fillRect(
          obstacle.x,
          canvas.height - obstacle.height,
          obstacle.width,
          obstacle.height
        )
      })
      
      // Draw particles
      ctx.fillStyle = '#ff0'
      particlesRef.current.forEach(particle => {
        if (!particle.collected) {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    if (isPlaying) gameLoop()
    
    // Keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        jump()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    // Mobile touch support
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      jump()
    }
    canvas.addEventListener('touchstart', handleTouchStart)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [isPlaying, jump, addObstacle, addEnergyParticle, playSound, aiMode])
  
  // Solana: Wallet Bağlantısı
  const connectWallet = useCallback(async () => {
    if (window.solana) {
      try {
        const response = await window.solana.connect()
        setWalletAddress(response.publicKey.toString())
      } catch (error) {
        console.error("Wallet connection error:", error)
      }
    } else {
      alert("Solana wallet bulunamadı. Lütfen Phantom gibi bir cüzdan kurun.")
    }
  }, [])

  // Solana: Oyun Sonu Verilerini Gönder (Memo Program kullanılarak)
  const sendGameData = useCallback(async () => {
    if (!window.solana) {
      alert("Solana wallet bulunamadı. Lütfen bir cüzdan kurun.")
      return
    }
    try {
      const wallet = window.solana
      if (!wallet.isConnected) {
        await wallet.connect()
      }
      const publicKey = wallet.publicKey.toString()
      const connection = new Connection(clusterApiUrl('devnet'))
      const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
      
      const gameData = {
        score,
        jumpCount: jumpCountRef.current,
        wallet: publicKey
      }
      
      const gameDataString = JSON.stringify(gameData)
      
      const instruction = new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data: Buffer.from(gameDataString)
      })
      
      const transaction = new Transaction().add(instruction)
      transaction.feePayer = wallet.publicKey
      const { blockhash } = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash
      
      const signed = await wallet.signTransaction(transaction)
      const txid = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(txid)
      alert(`İşlem başarılı: ${txid}`)
    } catch (error) {
      console.error("Error sending game data:", error)
      alert("Veri gönderilirken bir hata oluştu.")
    }
  }, [score])
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8 relative">
      <div ref={containerRef} className="relative w-full max-w-[800px] cursor-pointer">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-green-500/30 rounded-lg shadow-lg bg-black touch-none"
        />
        
        {/* Scores */}
        <div className="absolute top-4 left-4 text-green-400 font-mono">
          <div className="text-xl">SCORE: {score}</div>
          <div className="text-sm opacity-75">BEST: {bestScore}</div>
        </div>
        
        {/* AI Mode Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setAiMode(!aiMode)}
            className={`px-4 py-2 rounded-lg border transition-all duration-300 font-mono text-sm
              ${aiMode 
                ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400' 
                : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'}`}
          >
            {aiMode ? 'NEURAL MODE ACTIVE' : 'NEURAL MODE PASSIVE'}
          </button>
          
          {aiMode && isPlaying && (
            <div className="mt-2 p-3 bg-black/80 border border-fuchsia-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></div>
                <span className="text-fuchsia-400 text-xs">NEURAL NETWORK PROCESSING</span>
              </div>
              <pre className="text-[10px] text-fuchsia-400/70 whitespace-pre-wrap">
                {aiThoughts}
              </pre>
            </div>
          )}
        </div>
        
        {/* Controls Info */}
        <div className="absolute bottom-4 left-4 text-cyan-400/70 font-mono text-sm">
          {!aiMode && (
            <div>SPACE / Tap: Jump</div>
          )}
        </div>
        
        {/* Start/Restart Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
            <button
              className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg 
                hover:bg-cyan-500/30 transition-all duration-300 group"
              onClick={startGame}
            >
              <span className="text-cyan-400 font-mono text-xl group-hover:text-cyan-300">
                {score > 0 ? 'RESTART' : 'START SYSTEM'}
              </span>
            </button>
            <p className="mt-4 text-green-400 font-mono text-sm">
              {aiMode ? 'NEURAL NETWORK CONTROLLING' : 'SPACE / Tap: Jump'}
            </p>
          </div>
        )}
      </div>
      
      {/* Oyun Bittiğinde, alt kısımda “Matrix” görünümünde oyun verileri */}
      {!isPlaying && score > 0 && (
        <div className="mt-4 p-4 border border-green-500/30 rounded-lg bg-black w-full max-w-[800px]">
          <h3 className="text-green-400 font-mono text-lg mb-2">Neural Matrix Learning</h3>
          <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap">
{`SCORE: ${score}
JUMP COUNT: ${jumpCountRef.current}
WALLET: ${walletAddress ? walletAddress : 'Not Connected'}`}
          </pre>
          {walletAddress ? (
            <button 
              onClick={sendGameData} 
              className="mt-2 px-4 py-2 border border-green-500/50 text-green-400 font-mono rounded hover:bg-green-500/20 transition"
            >
              Send Data to Solana
            </button>
          ) : (
            <button 
              onClick={connectWallet} 
              className="mt-2 px-4 py-2 border border-green-500/50 text-green-400 font-mono rounded hover:bg-green-500/20 transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default NeuralRunner
