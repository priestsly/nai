'use client'

import { useState, useEffect, useRef } from 'react'
import { FaPaperPlane, FaRobot, FaUser, FaVolumeUp, FaVolumeMute } from 'react-icons/fa'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are NEON, an AI assistant who speaks in a cyberpunk style. You provide technical support to users. You can respond in any language the user uses, including Turkish.'
    },
    {
      role: 'assistant',
      content: 'Neural Link v2.0 active. NEON online. How can I assist you, netrunner?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Add a thinking message
      setMessages(prev => [...prev, { role: 'assistant', content: 'thinking...' }])
      
      // Make API call to Gemini - use absolute URL for deployment compatibility
      const apiUrl = window.location.hostname === 'localhost' 
        ? '/api/gemini' 
        : `${window.location.origin}/api/gemini`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.filter(m => m.role !== 'assistant' || m.content !== 'thinking...').concat([
            { role: 'user', content: userMessage }
          ])
        })
      })

      if (!response.ok) {
        throw new Error(`Neural network connection failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Remove thinking message and add the actual response
      const assistantResponse = data.response
      setMessages(prev => [
        ...prev.filter(m => m.content !== 'thinking...'),
        { role: 'assistant', content: assistantResponse }
      ])
      
      // Speak the response if speech is enabled
      if (isSpeechEnabled) {
        speakText(assistantResponse)
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      setError(`Neural Link disrupted: ${error.message}. Attempting to reconnect...`)
      
      // Remove thinking message and add error message
      setMessages(prev => [
        ...prev.filter(m => m.content !== 'thinking...'),
        {
          role: 'assistant',
          content: 'Neural Link connection anomaly detected. Retrying connection...'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to speak text using Web Speech API
  const speakText = (text: string) => {
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      console.warn('No speech synthesis voices available')
      return
    }

    // Find Turkish and English voices
    const turkishVoice = voices.find(voice => voice.lang.includes('tr'))
    const englishVoice = voices.find(voice => voice.lang.includes('en'))
    const defaultVoice = englishVoice || voices[0]
    
    // Check if text contains mixed languages
    const hasTurkishChars = /[çğıöşüÇĞİÖŞÜ]/.test(text)
    const hasEnglishOnly = /^[a-zA-Z0-9\s.,?!;:'"()\-_]+$/.test(text)
    
    // If text is short, use a single utterance with the most appropriate voice
    if (text.length < 100) {
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthesisRef.current = utterance
      
      // Select voice based on content
      utterance.voice = hasTurkishChars && turkishVoice ? turkishVoice : defaultVoice
      
      // Set properties
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Speak
      window.speechSynthesis.speak(utterance)
      return
    }
    
    // For longer text, try to split by sentences and detect language for each
    const sentences = text.match(/[^.!?\r\n]+[.!?\r\n]+/g) || [text]
    
    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence)
      
      // Detect language for this sentence
      const sentenceHasTurkish = /[çğıöşüÇĞİÖŞÜ]/.test(sentence)
      const sentenceIsEnglishOnly = /^[a-zA-Z0-9\s.,?!;:'"()\-_]+$/.test(sentence)
      
      // Select appropriate voice for this sentence
      if (sentenceHasTurkish && turkishVoice) {
        utterance.voice = turkishVoice
      } else if (sentenceIsEnglishOnly && englishVoice) {
        utterance.voice = englishVoice
      } else {
        utterance.voice = defaultVoice
      }
      
      // Set properties
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Store reference to the last utterance
      if (index === sentences.length - 1) {
        speechSynthesisRef.current = utterance
      }
      
      // Speak
      window.speechSynthesis.speak(utterance)
    })
  }
  
  // Handle voice loading
  useEffect(() => {
    // Load voices when component mounts
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    
    // Chrome needs this event listener to load voices
    if (window.speechSynthesis) {
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    
    // Cleanup
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel()
        }
      }
    }
  }, [])
  
  // Toggle speech function
  const toggleSpeech = () => {
    if (isSpeechEnabled) {
      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
    setIsSpeechEnabled(!isSpeechEnabled)
  }
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-3/4 bg-black/40">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          message.role !== 'system' && (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${message.role === 'user' 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}
              >
                {message.role === 'user' ? <FaUser /> : <FaRobot />}
              </div>
              <div
                className={`px-4 py-2 rounded-lg max-w-[80%] backdrop-blur-sm whitespace-pre-wrap
                  ${message.role === 'user'
                    ? 'bg-pink-950/30 text-pink-200 ml-auto border border-pink-500/20'
                    : 'bg-cyan-950/30 text-cyan-200 border border-cyan-500/20'
                  } shadow-lg`}
              >
                {message.content}
              </div>
            </div>
          )
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400">
            <div className="animate-spin">◌</div>
            <span>NEON thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-2 border-t border-cyan-500/30 bg-black/30 flex justify-end">
        <button
          onClick={toggleSpeech}
          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 p-2 rounded-lg
            transition-colors border border-cyan-500/30 hover:border-cyan-500/50 backdrop-blur-sm"
          title={isSpeechEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {isSpeechEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-cyan-500/30 bg-black/20 relative z-40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to NEON..."
            className="flex-1 bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-2
              text-cyan-100 placeholder-cyan-700 focus:outline-none focus:border-cyan-500
              transition-colors backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-500/30
              hover:border-cyan-500/50 backdrop-blur-sm"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  )
}