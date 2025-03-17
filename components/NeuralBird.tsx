import * as tf from '@tensorflow/tfjs'
import { useEffect, useRef, useState, useCallback } from 'react'

// Oyunun bazı sabitleri
const BIRD_SIZE = 20
const PIPE_WIDTH = 60
const PIPE_GAP = 150
const GRAVITY = 0.6
const JUMP_FORCE = -10
const INITIAL_PIPE_SPEED = 3

const NeuralBird = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)

  // Game state refs
  const birdYRef = useRef(0)
  const birdVelocityRef = useRef(0)
  const pipesRef = useRef<{ x: number, topHeight: number }[]>([])
  const gameSpeedRef = useRef(INITIAL_PIPE_SPEED)

  // Scores
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // AI Mode
  const [aiMode, setAiMode] = useState(false)
  const [aiThoughts, setAiThoughts] = useState<string>("")

  // TensorFlow.js model referansı
  const modelRef = useRef<tf.LayersModel | null>(null)

  // Modeli yükleyen fonksiyon
  const loadAiModel = useCallback(async () => {
    // Modelinizi ya da model URL'nizi belirtin.
    // Örneğin, public klasörünüzdeki 'model.json' dosyasını yükleyebilirsiniz.
    modelRef.current = await tf.loadLayersModel('/model/model.json')
    console.log('AI Model yüklendi.')
  }, [])

  // Oyun başlangıcı
  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    birdYRef.current = canvas.height / 2
    birdVelocityRef.current = 0
    pipesRef.current = []
    gameSpeedRef.current = INITIAL_PIPE_SPEED
    setScore(0)
    setIsPlaying(true)
  }, [])

  // Oyuncu hareketi: zıplama
  const jump = useCallback(() => {
    if (!isPlaying) {
      startGame()
      return
    }
    birdVelocityRef.current = JUMP_FORCE
  }, [isPlaying, startGame])

  // Gerçek AI karar verme sistemi (TensorFlow.js kullanarak)
  const makeRealAiDecision = useCallback(async () => {
    if (!isPlaying || !aiMode || !modelRef.current) return false

    // Örnek: Modelinizin girdi olarak şu bilgileri beklediğini varsayıyoruz:
    // [birdY, birdVelocity, nextPipeX, nextPipeTopHeight]
    const nextPipe = pipesRef.current[0]
    if (!nextPipe) return false

    // Girdi verilerini hazırla
    const inputData = [
      birdYRef.current,
      birdVelocityRef.current,
      nextPipe.x,
      nextPipe.topHeight
    ]
    // TensorFlow.js girdi tensörü oluştur
    const inputTensor = tf.tensor2d([inputData])

    // Modelden tahmin al (çıktı 0-1 arası olmalı: zıplama ihtimali)
    const outputTensor = modelRef.current.predict(inputTensor) as tf.Tensor
    const outputData = await outputTensor.data()
    const jumpProbability = outputData[0]
    
    // AI'nın düşündüğü bilgileri güncelle
    setAiThoughts(`AI Tahmin: ${Math.round(jumpProbability * 100)}%`)

    // Belirlediğiniz eşik değere göre zıplama kararı verin
    return jumpProbability > 0.5
  }, [isPlaying, aiMode])

  // Oyun döngüsü ve AI kontrolü
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = Math.min(800, window.innerWidth - 32)
      canvas.height = Math.min(600, window.innerHeight - 100)
    }
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const gameLoop = async () => {
      if (!isPlaying) return

      // Kuş fiziği
      birdVelocityRef.current += GRAVITY
      birdYRef.current += birdVelocityRef.current

      // Boruları güncelle
      pipesRef.current.forEach(pipe => {
        pipe.x -= gameSpeedRef.current
      })

      // Yeni boru ekleme ve skor güncelleme (basit kontrol)
      if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < canvas.width - 300) {
        const minHeight = 50
        const maxHeight = canvas.height - PIPE_GAP - minHeight
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight
        pipesRef.current.push({ x: canvas.width, topHeight })
      }
      if (pipesRef.current[0] && pipesRef.current[0].x < -PIPE_WIDTH) {
        pipesRef.current.shift()
        setScore(s => s + 1)
        gameSpeedRef.current += 0.1
      }

      // Çarpışma kontrolü
      const birdRect = { x: 50, y: birdYRef.current, width: BIRD_SIZE, height: BIRD_SIZE }
      if (birdYRef.current < 0 || birdYRef.current > canvas.height - BIRD_SIZE) {
        setIsPlaying(false)
        return
      }
      for (const pipe of pipesRef.current) {
        if (
          birdRect.x + birdRect.width > pipe.x &&
          birdRect.x < pipe.x + PIPE_WIDTH &&
          (birdRect.y < pipe.topHeight || birdRect.y + birdRect.height > pipe.topHeight + PIPE_GAP)
        ) {
          setIsPlaying(false)
          return
        }
      }

      // Çizim
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      pipesRef.current.forEach(pipe => {
        ctx.fillStyle = '#f0f'
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.topHeight + PIPE_GAP))
      })
      ctx.fillStyle = '#0ff'
      ctx.beginPath()
      ctx.arc(50, birdYRef.current, BIRD_SIZE, 0, Math.PI * 2)
      ctx.fill()

      // Eğer AI modu aktifse, modelden karar al ve gerekirse zıpla
      if (aiMode) {
        const shouldJump = await makeRealAiDecision()
        if (shouldJump) {
          jump()
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [isPlaying, aiMode, jump, makeRealAiDecision])

  // Sayfa yüklendiğinde modeli yükleyin
  useEffect(() => {
    loadAiModel()
  }, [loadAiModel])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8 relative">
      <canvas ref={canvasRef} className="w-full h-full border rounded-lg shadow-lg bg-black" />
      {/* Oyun Bilgileri */}
      <div className="absolute top-4 left-4 text-green-400 font-mono">
        <div className="text-xl">SCORE: {score}</div>
      </div>
      {/* AI Mode Toggle ve AI Düşünceleri */}
      <div className="absolute top-4 right-4 flex flex-col items-end">
        <button
          onClick={() => setAiMode(!aiMode)}
          className={`px-4 py-2 rounded-lg border transition-all duration-300 font-mono text-sm
            ${aiMode 
              ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400' 
              : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'}`}
        >
          {aiMode ? 'NEURAL MODE ACTIVE' : 'NEURAL MODE INACTIVE'}
        </button>
        {aiMode && (
          <div className="mt-2 p-3 bg-black/80 border border-fuchsia-500/30 rounded-lg">
            <pre className="text-[10px] text-fuchsia-400/70 whitespace-pre-wrap">
              {aiThoughts}
            </pre>
          </div>
        )}
      </div>
      {/* Başlat/Restart Butonu */}
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg">
          <button
            className="px-8 py-3 bg-cyan-500/20 border rounded-lg hover:bg-cyan-500/30 transition-all duration-300"
            onClick={startGame}
          >
            <span className="text-cyan-400 font-mono text-xl">
              {score > 0 ? 'RESTART FLIGHT' : 'INITIALIZE FLIGHT'}
            </span>
          </button>
          <p className="mt-4 text-green-400 font-mono text-sm">
            {aiMode ? 'NEURAL NETWORK IN CONTROL' : 'PRESS SPACE OR CLICK'}
          </p>
        </div>
      )}
    </div>
  )
}

export default NeuralBird
