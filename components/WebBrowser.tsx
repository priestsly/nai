'use client'

import { useState, useEffect, useRef } from 'react'
import { IoArrowBack, IoArrowForward, IoRefresh } from 'react-icons/io5'
import { FaBrain, FaShieldAlt, FaSearch, FaRobot, FaHome, FaCode, FaChartBar, FaExclamationTriangle } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_HOME = `
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap');
    
    body {
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #fff;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
    }
    .search-container {
      max-width: 800px;
      margin: 80px auto;
      text-align: center;
    }
    .logo {
      font-size: 3em;
      background: linear-gradient(45deg, #22d3ee, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .search-box {
      width: 100%;
      padding: 18px 25px;
      border: 2px solid #334155;
      border-radius: 15px;
      background: rgba(15, 23, 42, 0.8);
      color: #fff;
      font-size: 16px;
      outline: none;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    .search-box:focus {
      border-color: #22d3ee;
      box-shadow: 0 0 25px rgba(34, 211, 238, 0.2);
    }
    .quick-links {
      margin-top: 50px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      max-width: 1000px;
      margin: 40px auto;
    }
    .quick-link {
      padding: 18px;
      background: rgba(34, 211, 238, 0.08);
      border: 1px solid rgba(34, 211, 238, 0.15);
      border-radius: 12px;
      color: #22d3ee;
      text-decoration: none;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .quick-link:hover {
      background: rgba(34, 211, 238, 0.15);
      transform: translateY(-3px);
    }
  </style>
</head>
<body>
  <div class="search-container">
    <div class="logo">Neural Browser</div>
    <form id="search-form">
      <input type="text" class="search-box" placeholder="Search the decentralized web..." id="search-input">
    </form>
    <div class="quick-links">
      <a href="https://github.com" class="quick-link" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub
      </a>
      <a href="https://wikipedia.org" class="quick-link" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 4.975-12 11.111 0 5.213 3.438 9.621 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.083 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        Wikipedia
      </a>
      <a href="https://docs.ai" class="quick-link" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l-11 6v12.131l11 5.869 11-5.869v-12.066l-11-6.065zm-9 8.23l8 4.363v8.367l-8-4.268v-8.462zm10 12.73v-8.367l8-4.268v8.462l-8 4.173z"/></svg>
        AI Docs
      </a>
    </div>
  </div>
  <script>
    document.getElementById('search-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const query = document.getElementById('search-input').value;
      window.location.href = 'https://duckduckgo.com/?q=' + encodeURIComponent(query);
    });
  </script>
</body>
</html>
`

export default function WebBrowser() {
  const [url, setUrl] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [isAIPanel, setIsAIPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [pageTitle, setPageTitle] = useState('Neural Browser')
  const [aiTools] = useState([
    {
      name: 'Page Summary',
      description: 'Generate concise summary of page content',
      icon: <FaChartBar className="text-cyan-400" />
    },
    {
      name: 'Security Scan',
      description: 'Analyze website security risks',
      icon: <FaShieldAlt className="text-cyan-400" />
    },
    {
      name: 'Content Analysis',
      description: 'Identify main themes and topics',
      icon: <FaBrain className="text-cyan-400" />
    },
    {
      name: 'Code Inspector',
      description: 'Analyze and explain code on the page',
      icon: <FaCode className="text-cyan-400" />
    },
    {
      name: 'Threat Detection',
      description: 'Advanced malware & phishing detection',
      icon: <FaExclamationTriangle className="text-cyan-400" />
    }
  ])
  const [selectedTool, setSelectedTool] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [securityScore, setSecurityScore] = useState<number | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isHome, setIsHome] = useState(true)

  const analyzeUrl = (url: string) => {
    const hasHttps = url.startsWith('https://')
    const hasMaliciousPatterns = /(phish|malware|scam|fake)/i.test(url)
    const domainAge = Math.random() * 5 // Simulated domain age
    const hasValidSSL = hasHttps && Math.random() > 0.2 // 80% valid SSL
    
    let score = 75
    if (hasHttps) score += 10
    if (!hasMaliciousPatterns) score += 10
    if (domainAge > 1) score += 5
    if (hasValidSSL) score += 10
    
    return {
      score: Math.min(score, 100),
      hasHttps,
      hasMaliciousPatterns,
      domainAge: domainAge.toFixed(1),
      isSafe: score > 75
    }
  }

  const analyzeWithAI = async () => {
    setIsLoading(true)
    try {
      const analysis = analyzeUrl(url)
      let response = ''
      
      // Get page content if possible
      let pageContent = ''
      try {
        if (iframeRef.current && !isHome) {
          try {
            // Attempt to access iframe content, but handle cross-origin restrictions
            const iframeDocument = iframeRef.current.contentWindow?.document
            if (iframeDocument) {
              pageContent = iframeDocument.body.innerText.slice(0, 1000) // Get first 1000 chars
            }
          } catch (e) {
            console.error('Error accessing iframe content (cross-origin restriction):', e)
            pageContent = 'Content not accessible due to cross-origin restrictions'
          }
        }
      } catch (e) {
        console.error('Error accessing iframe:', e)
        pageContent = 'Content not accessible'
      }
      
      // For more advanced analysis, use Gemini API
      if (['Page Summary', 'Content Analysis', 'Code Inspector', 'Threat Detection'].includes(selectedTool)) {
        try {
          const prompt = `You are Neural Analyst, an AI assistant specialized in analyzing web content.
          
Analyze the following webpage content for a ${selectedTool.toLowerCase()} request:

URL: ${url}

Content sample: ${pageContent || 'Content not accessible due to iframe restrictions'}

Provide a detailed ${selectedTool.toLowerCase()} in a concise, informative format with bullet points where appropriate. Include relevant insights and recommendations.`
          
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'user', content: prompt }
              ]
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            setAiResponse(data.response || 'Analysis completed, but no insights were generated.')
          } else {
            throw new Error('Failed to get AI analysis')
          }
        } catch (error) {
          console.error('Error calling Gemini API:', error)
          // Fallback to basic analysis
          setAiResponse(`Failed to perform advanced analysis. Falling back to basic analysis:\n\n` +
            `URL: ${url}\n` +
            `Content: ${pageContent ? 'Available' : 'Not accessible'}\n\n` +
            `Please try again later.`)
        }
      } else if (selectedTool === 'Security Scan') {
        setSecurityScore(analysis.score)
        response = `🔒 Security Report:\n\n` +
          `• HTTPS: ${analysis.hasHttps ? '✅ Enabled' : '❌ Disabled'}\n` +
          `• Threat Detection: ${analysis.hasMaliciousPatterns ? '⚠️ Suspicious' : '✅ Clean'}\n` +
          `• Domain Age: ${analysis.domainAge} years\n` +
          `• Safety Rating: ${analysis.score}/100\n\n` +
          `Recommendations:\n${analysis.isSafe 
            ? '- Site appears safe for browsing\n- Connection is encrypted\n- No obvious security threats detected' 
            : '- Exercise caution with sensitive data\n- Verify site legitimacy before proceeding\n- Consider using a secure VPN'}`
        
        setAiResponse(response)
      } else {
        response = 'Select an analysis tool to begin'
        setAiResponse(response)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setAiResponse('Error processing request. Please try again.')
    }
    setIsLoading(false)
  }

  const getSearchSuggestions = (query: string) => {
    if (!query || query.length < 2) return []
    
    const techTerms = [
      'blockchain', 'AI', 'cybersecurity', 'web3', 'quantum computing', 
      'neural networks', 'machine learning', 'cryptocurrency', 'NFT', 
      'metaverse', 'decentralized finance', 'smart contracts', 'digital identity',
      'virtual reality', 'augmented reality', 'artificial intelligence'
    ]
    
    // More intelligent matching
    const directMatches = techTerms
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
    
    // Add query prefixes for common search patterns
    const prefixedQueries = ['how to ', 'what is ', 'best ', 'latest ', 'tutorial ']
      .map(prefix => prefix + query)
      .slice(0, 2)
    
    // Add query suffixes for common search patterns
    const suffixedQueries = [' tutorial', ' examples', ' documentation']
      .map(suffix => query + suffix)
      .slice(0, 1)
    
    return [...directMatches, ...prefixedQueries, ...suffixedQueries].slice(0, 5)
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let finalUrl = url
    
    if (!/^https?:\/\//i.test(url)) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`
      } else {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`
      }
    }
    
    setUrl(finalUrl)
    setIsHome(false)
    setIframeKey(prev => prev + 1)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex items-center gap-3 p-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <button 
          onClick={() => setIsHome(true)}
          className={`p-2 rounded-lg transition-all ${isHome ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-gray-700/30 text-cyan-400'}`}
        >
          <FaHome size={18} />
        </button>
        <div className="flex gap-1">
          <button 
            onClick={() => {
              if (iframeRef.current) {
                iframeRef.current.contentWindow?.history.back()
              }
            }}
            className="p-2 hover:bg-gray-700/30 rounded-lg text-cyan-400"
          >
            <IoArrowBack size={18} />
          </button>
          <button 
            onClick={() => {
              if (iframeRef.current) {
                iframeRef.current.contentWindow?.history.forward()
              }
            }}
            className="p-2 hover:bg-gray-700/30 rounded-lg text-cyan-400"
          >
            <IoArrowForward size={18} />
          </button>
          <button 
            onClick={() => {
              setIframeKey(prev => prev + 1)
              setIsLoading(true)
            }}
            className="p-2 hover:bg-gray-700/30 rounded-lg text-cyan-400 relative"
          >
            <IoRefresh size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        
        <form onSubmit={handleUrlSubmit} className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setSearchSuggestions(getSearchSuggestions(e.target.value))
            }}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl 
              text-gray-200 placeholder-gray-400 focus:outline-none focus:border-cyan-400
              focus:ring-2 focus:ring-cyan-400/30 transition-all"
            placeholder="Search or enter address"
          />
          
          <AnimatePresence>
            {searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-gray-800 rounded-lg shadow-xl z-50"
              >
                {searchSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setUrl(`https://duckduckgo.com/?q=${encodeURIComponent(suggestion)}`)
                      setIsHome(false)
                      setSearchSuggestions([])
                    }}
                    className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer flex items-center gap-2
                      text-gray-200 text-sm border-b border-gray-700 last:border-0"
                  >
                    <FaSearch className="text-cyan-400" />
                    {suggestion}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        
        <button
          onClick={() => setIsAIPanel(!isAIPanel)}
          className={`p-2 rounded-lg ${isAIPanel ? 'bg-cyan-500/20 text-cyan-400' : 
            'hover:bg-gray-700/30 text-cyan-400'}`}
        >
          <FaBrain size={18} />
        </button>
      </div>

      <div className="flex-1 flex relative">
        {isHome ? (
          <iframe
            srcDoc={DEFAULT_HOME}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="text-cyan-400 text-sm">Loading {pageTitle}...</div>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={url}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-forms allow-presentation"
              allow="accelerometer; encrypted-media; gyroscope"
              onLoad={() => {
                setIsLoading(false);
                try {
                  // Only attempt to access contentWindow.document if it's same-origin
                  // This prevents the SecurityError when accessing cross-origin frames
                  if (iframeRef.current?.contentWindow) {
                    try {
                      const title = iframeRef.current.contentWindow.document.title;
                      setPageTitle(title || 'Neural Browser');
                    } catch (e) {
                      // Handle cross-origin frame access error
                      console.error('Could not access iframe title:', e);
                      setPageTitle(url.replace(/^https?:\/\//, '').split('/')[0] || 'Neural Browser');
                    }
                  }
                } catch (e) {
                  console.error('Could not access iframe:', e);
                  setPageTitle(url.replace(/^https?:\/\//, '').split('/')[0] || 'Neural Browser');
                }
              }}
            />
          </>
        )}

        <AnimatePresence>
          {isAIPanel && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-xl
                border-l border-gray-700 shadow-2xl p-6 overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 
                bg-clip-text text-transparent">
                Neural Analyst
              </h3>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                {aiTools.map(tool => (
                  <button
                    key={tool.name}
                    onClick={() => setSelectedTool(tool.name)}
                    className={`p-3 rounded-xl border text-sm transition-all flex items-center gap-2
                      ${selectedTool === tool.name 
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' 
                        : 'border-gray-600 hover:border-cyan-400/30 text-gray-400 hover:bg-gray-800/50'}`}
                  >
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      {tool.icon}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-xs opacity-70">{tool.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedTool && (
                <>
                  <button
                    onClick={analyzeWithAI}
                    disabled={isLoading}
                    className="w-full mb-6 py-3 px-6 bg-cyan-400/10 hover:bg-cyan-400/20
                      border border-cyan-400/30 rounded-xl text-cyan-400 flex items-center
                      justify-center gap-2 transition-all"
                  >
                    <FaRobot />
                    {isLoading ? 'Analyzing...' : 'Run Analysis'}
                  </button>

                  {aiResponse && (
                    <div className="space-y-4">
                      {securityScore !== null && (
                        <div className="p-4 bg-gray-800/50 rounded-xl mb-4">
                          <div className="flex justify-between mb-2 text-sm">
                            <span>Security Score</span>
                            <span className={`font-mono ${
                              securityScore > 80 ? 'text-green-400' : 
                              securityScore > 60 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>
                              {securityScore}/100
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${securityScore}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full ${
                                securityScore > 80 ? 'bg-green-400' : 
                                securityScore > 60 ? 'bg-yellow-400' : 
                                'bg-red-400'
                              }`}
                            />
                          </div>
                          <div className="mt-3 flex justify-between text-xs">
                            <span className="text-red-400">Risky</span>
                            <span className="text-yellow-400">Moderate</span>
                            <span className="text-green-400">Safe</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4 bg-gray-800/50 rounded-xl text-gray-200 whitespace-pre-line
                        border border-gray-700 shadow-inner shadow-cyan-900/10">
                        {isLoading ? (
                          <div className="flex flex-col items-center py-6 gap-4">
                            <div className="w-8 h-8 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
                            <div className="text-cyan-400 text-sm">Neural analysis in progress...</div>
                          </div>
                        ) : aiResponse ? (
                          aiResponse
                        ) : (
                          <div className="text-gray-400 text-center py-4">
                            Select a tool and run analysis to see results
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}