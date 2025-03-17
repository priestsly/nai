'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const PADDLE_WIDTH = 15
const PADDLE_HEIGHT = 80
const BALL_SIZE = 10
const INITIAL_BALL_SPEED = 5

const NeuralPong = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<number>(0)
  
  // Game state refs
  const paddleYRef = useRef(0)
  const aiPaddleYRef = useRef(0)
  const ballXRef = useRef(0)
  const ballYRef = useRef(0)
  const ballSpeedXRef = useRef(INITIAL_BALL_SPEED)
  const ballSpeedYRef = useRef(INITIAL_BALL_SPEED)

  // AI state
  const [aiThoughts, setAiThoughts] = useState("Nöral Ağ Başlatılıyor...")
  const [difficultyLevel, setDifficultyLevel] = useState(1)
  const predictionPathRef = useRef<{x: number, y: number}[]>([])
  const lastMoveRef = useRef<number>(Date.now())
  const audioContextRef = useRef<AudioContext | null>(null)

  // Scores
  const [score, setScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Add new state for player AI mode
  const [isPlayerAI, setIsPlayerAI] = useState(false)
  const touchStartYRef = useRef<number | null>(null)
  const lastPlayerMoveRef = useRef<number>(Date.now())

  // Ball reset
  const resetBall = useCallback((direction: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    ballXRef.current = canvas.width / 2
    ballYRef.current = canvas.height / 2
    ballSpeedXRef.current = direction * (INITIAL_BALL_SPEED + difficultyLevel)
    ballSpeedYRef.current = (Math.random() * 2 - 1) * INITIAL_BALL_SPEED
  }, [difficultyLevel])

  // Game start
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    aiPaddleYRef.current = canvas.height / 2 - PADDLE_HEIGHT / 2
    paddleYRef.current = canvas.height / 2 - PADDLE_HEIGHT / 2
    resetBall(Math.random() > 0.5 ? 1 : -1)
    
    setIsPlaying(true)
    setScore(0)
    setAiScore(0)
    setDifficultyLevel(1)
    setAiThoughts("Oyun Başlatıldı ✓")
    
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.AudioContext)()
  }, [resetBall])

  // AI calculations
  const calculateFuturePosition = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0

    const steps = []
    let x = ballXRef.current
    let y = ballYRef.current
    let speedX = ballSpeedXRef.current
    let speedY = ballSpeedYRef.current
    
    while(x > 0 && x < canvas.width) {
      x += speedX
      y += speedY
      
      if(y <= BALL_SIZE || y >= canvas.height - BALL_SIZE) {
        speedY *= -1
      }
      
      steps.push({x, y})
    }
    
    predictionPathRef.current = steps
    return y
  }, [])

  // AI brain
  const aiLogic = useCallback(() => {
    const now = Date.now()
    const reactionTime = Math.max(100 - (difficultyLevel * 15), 30)
    
    if(now - lastMoveRef.current > reactionTime) {
      const predictedY = calculateFuturePosition()
      const neuralNoise = (Math.random() - 0.5) * (40 - difficultyLevel * 3)
      
      const targetY = Math.min(
        Math.max(predictedY + neuralNoise, 0),
        (canvasRef.current?.height || 400) - PADDLE_HEIGHT
      )
      
      if(aiPaddleYRef.current !== undefined) {
        aiPaddleYRef.current += (targetY - aiPaddleYRef.current) * 0.12
      }
      
      lastMoveRef.current = now
      
      // Update AI thoughts
      const thoughts = [
        `Prediction: ${Math.round(predictedY)}px ±${Math.round(neuralNoise)}`,
        `Noise Level: ${Math.round(100 - (neuralNoise * 2))}%`,
        `Reaction Time: ${reactionTime}ms`,
        `Learning Rate: 0.${Math.round(difficultyLevel * 15)}`
      ]
      setAiThoughts(thoughts[Math.floor(Math.random() * thoughts.length)])
      
      // Play AI sound
      if(audioContextRef.current) {
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(
          300 + (difficultyLevel * 50),
          audioContextRef.current.currentTime
        )
        gainNode.gain.setValueAtTime(0.03, audioContextRef.current.currentTime)
        
        oscillator.start()
        oscillator.stop(audioContextRef.current.currentTime + 0.00201)
      }
    }
  }, [difficultyLevel])

  // Add player AI logic
  // Update player AI logic for faster movement
  const playerAiLogic = useCallback(() => {
    const now = Date.now()
    const reactionTime = 50 // Decreased from 150 for faster reactions
    
    if (now - lastPlayerMoveRef.current > reactionTime) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Enhanced prediction with better ball tracking
      const predictedY = ballYRef.current + (ballSpeedYRef.current * 3)
      const targetY = Math.min(
        Math.max(predictedY - PADDLE_HEIGHT / 2, 0),
        canvas.height - PADDLE_HEIGHT
      )
      
      // Increased movement speed from 0.1 to 0.25
      paddleYRef.current += (targetY - paddleYRef.current) * 0.25
      
      // Add slight randomization for more natural movement
      if (Math.random() > 0.95) {
        paddleYRef.current += (Math.random() - 0.5) * 5
      }
      
      lastPlayerMoveRef.current = now
    }
  }, [])

  // Game loop
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
      resetBall(1)
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Collision detection
    const checkCollision = (paddleY: number, isPlayer: boolean) => {
      const paddleX = isPlayer ? PADDLE_WIDTH : canvas.width - PADDLE_WIDTH * 2
      return ballXRef.current > paddleX - BALL_SIZE &&
             ballXRef.current < paddleX + PADDLE_WIDTH + BALL_SIZE &&
             ballYRef.current > paddleY - BALL_SIZE &&
             ballYRef.current < paddleY + PADDLE_HEIGHT + BALL_SIZE
    }

    // Drawing functions
    const drawNeuralNetwork = () => {
      ctx.fillStyle = 'rgba(255,0,255,0.05)'
      for(let i = 0; i < 30; i++) {
        ctx.beginPath()
        ctx.arc(
          canvas.width - PADDLE_WIDTH * 2,
          aiPaddleYRef.current + PADDLE_HEIGHT/2,
          Math.random() * 40,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    }

    const drawPredictionPath = () => {
      ctx.beginPath()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = `rgba(255, 0, 255, ${0.2 + (difficultyLevel * 0.05)})`
      ctx.lineWidth = 2
      predictionPathRef.current.forEach((pos, i) => {
        if(i === 0) ctx.moveTo(pos.x, pos.y)
        else ctx.lineTo(pos.x, pos.y)
      })
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Main loop
    const gameLoop = () => {
      if (!isPlaying) return

      // Update positions
      ballXRef.current += ballSpeedXRef.current
      ballYRef.current += ballSpeedYRef.current

      // Wall collisions
      if (ballYRef.current <= BALL_SIZE || ballYRef.current >= canvas.height - BALL_SIZE) {
        ballSpeedYRef.current *= -1
      }

      // Paddle collisions
      if (checkCollision(paddleYRef.current, true)) {
        ballSpeedXRef.current = Math.abs(ballSpeedXRef.current) * 1.1
      }

      if (checkCollision(aiPaddleYRef.current, false)) {
        ballSpeedXRef.current = -Math.abs(ballSpeedXRef.current) * 1.1
      }

      // Score handling
      if (ballXRef.current <= 0) {
        setAiScore(s => s + 1)
        resetBall(1)
      }
      if (ballXRef.current >= canvas.width) {
        setScore(s => s + 1)
        resetBall(-1)
      }

      // Adjust difficulty
      setDifficultyLevel(prev => Math.min(10, 1 + Math.floor((score + aiScore) / 3)))

      // Run AI logic
      aiLogic()

      // Run player AI if enabled
      if (isPlayerAI) {
        playerAiLogic()
      }

      // Clear canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw game elements
      ctx.fillStyle = '#0ff'
      ctx.fillRect(PADDLE_WIDTH, paddleYRef.current, PADDLE_WIDTH, PADDLE_HEIGHT)
      
      ctx.fillStyle = '#f0f'
      ctx.fillRect(canvas.width - PADDLE_WIDTH * 2, aiPaddleYRef.current, PADDLE_WIDTH, PADDLE_HEIGHT)
      
      ctx.beginPath()
      ctx.arc(ballXRef.current, ballYRef.current, BALL_SIZE, 0, Math.PI * 2)
      ctx.fillStyle = '#0f0'
      ctx.fill()

      // Draw AI elements
      drawNeuralNetwork()
      drawPredictionPath()

      // Continue loop
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    if (isPlaying) gameLoop()

    // Event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      paddleYRef.current = Math.max(0, 
        Math.min(e.clientY - rect.top - PADDLE_HEIGHT/2, canvas.height - PADDLE_HEIGHT)
      )
    }

    // Update touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      touchStartYRef.current = e.touches[0].clientY - rect.top
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!isPlayerAI) {
        const rect = canvas.getBoundingClientRect()
        const touchY = e.touches[0].clientY - rect.top
        paddleYRef.current = Math.max(0,
          Math.min(touchY - PADDLE_HEIGHT / 2, canvas.height - PADDLE_HEIGHT)
        )
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [isPlaying, resetBall, aiLogic, difficultyLevel, isPlayerAI, playerAiLogic])

  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-8 relative">
      <div ref={containerRef} className="relative w-full max-w-[800px] cursor-pointer">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-green-500/30 rounded-lg shadow-lg bg-black touch-none"
        />
        
        {/* AI Status Panel */}
        <div className="absolute top-4 right-4 text-fuchsia-400 text-xs font-mono bg-black/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></div>
            <div>NEURAL NETWORK ACTIVE</div>
          </div>
          <div className="text-[0.7rem] opacity-75">{aiThoughts}</div>
        </div>

        {/* Difficulty Level */}
        <div className="absolute bottom-4 left-4 text-fuchsia-400 text-sm font-mono">
          LEVEL: {difficultyLevel}
        </div>

        {/* Scores */}
        <div className="absolute top-4 left-4 text-green-400 font-mono">
          <div className="text-xl">YOU: {score}</div>
          <div className="text-xl opacity-75">AI: {aiScore}</div>
        </div>

        {/* Start/Restart Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
            <button 
              className="px-8 py-3 bg-fuchsia-500/20 border border-fuchsia-500/50 rounded-lg 
                hover:bg-fuchsia-500/30 transition-all duration-300 group"
              onClick={startGame}
            >
              <span className="text-fuchsia-400 font-mono text-xl group-hover:text-fuchsia-300">
                {score + aiScore > 0 ? 'RESTART' : 'START SYSTEM'}
              </span>
            </button>
          </div>
        )}

        {/* Add AI Toggle Button */}
        {isPlaying && (
          <div className="absolute bottom-4 right-4">
            <button
              className={`px-4 py-2 rounded-lg font-mono text-sm ${
                isPlayerAI ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}
              onClick={() => setIsPlayerAI(!isPlayerAI)}
            >
              {isPlayerAI ? 'AI CONTROL' : 'MANUAL CONTROL'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NeuralPong