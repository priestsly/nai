'use client'

import { useState, useRef, useEffect } from 'react'
import { FaUpload, FaLink, FaCopy, FaRobot, FaInfoCircle, FaTrash, FaDownload, FaUsers, FaExchangeAlt } from 'react-icons/fa'
import SimplePeer from 'simple-peer'

interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  url: string
  expiryTime: number
  data?: ArrayBuffer
  progress?: number
  status?: 'uploading' | 'downloading' | 'completed' | 'failed'
}

interface PeerConnection {
  id: string
  peer: SimplePeer.Instance
  connected: boolean
}

export default function FileShare() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [aiGuidance, setAiGuidance] = useState('')
  const [showGuidance, setShowGuidance] = useState(true)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // P2P bağlantı yönetimi için state'ler
  const [peerId, setPeerId] = useState<string>('')
  const [peers, setPeers] = useState<PeerConnection[]>([])
  const [connectingPeerId, setConnectingPeerId] = useState<string>('')
  const [isInitiator, setIsInitiator] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showPeerSection, setShowPeerSection] = useState(false)

  // Simulated AI guidance messages
  const guidanceMessages = [
    "Drag and drop files here to share them securely.",
    "Your files will be available for 24 hours before being automatically deleted.",
    "Each file gets a unique link that you can share with anyone.",
    "Files are encrypted during transfer for maximum security.",
    "Need help? Just ask and I'll guide you through the process."
  ]

  useEffect(() => {
    // Rotate through AI guidance messages
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * guidanceMessages.length)
      setAiGuidance(guidanceMessages[randomIndex])
    }, 8000)

    // Set initial guidance
    setAiGuidance(guidanceMessages[0])

    // Generate a random peer ID for this client
    const randomId = Math.random().toString(36).substring(2, 10)
    setPeerId(randomId)

    return () => {
      clearInterval(interval)
      // Disconnect all peers when component unmounts
      peers.forEach(peerConn => {
        if (peerConn.peer) {
          peerConn.peer.destroy()
        }
      })
    }
  }, [])
  
  // P2P bağlantı oluşturma
  const createPeerConnection = (targetPeerId: string, initiator: boolean) => {
    try {
      setConnectionError(null)
      setIsInitiator(initiator)
      
      const peer = new SimplePeer({
        initiator,
        trickle: false
      })
      
      const peerConnection: PeerConnection = {
        id: targetPeerId,
        peer,
        connected: false
      }
      
      peer.on('signal', data => {
        // Signal verisi oluştuğunda, bu veriyi diğer peer'a iletmek gerekir
        // Gerçek bir uygulamada bu veri bir sinyal sunucusu üzerinden iletilir
        // Burada sadece konsola yazdırıyoruz
        console.log('SIGNAL', JSON.stringify(data))
        setAiGuidance(`Bağlantı kodu oluşturuldu. Bu kodu karşı tarafa iletmeniz gerekiyor.`)
      })
      
      peer.on('connect', () => {
        console.log('CONNECTED')
        setPeers(prev => prev.map(p => 
          p.id === targetPeerId ? { ...p, connected: true } : p
        ))
        setAiGuidance(`${targetPeerId} ile bağlantı kuruldu! Artık dosya paylaşabilirsiniz.`)
        setShowGuidance(true)
      })
      
      peer.on('data', data => {
        // Veri alındığında işleme
        handleReceivedData(data)
      })
      
      peer.on('error', err => {
        console.error('Peer connection error:', err)
        setConnectionError(`Bağlantı hatası: ${err.message}`)
        setPeers(prev => prev.filter(p => p.id !== targetPeerId))
      })
      
      setPeers(prev => [...prev, peerConnection])
      return peer
    } catch (error: any) {
      console.error('Error creating peer connection:', error)
      setConnectionError(`Bağlantı oluşturma hatası: ${error.message}`)
      return null
    }
  }
  
  // Dosya parçalarını geçici olarak saklamak için bir nesne
  const [fileChunks, setFileChunks] = useState<Record<string, { chunks: (Uint8Array | null)[], received: number, total: number }>>({});

  // Diğer peer'dan gelen veriyi işleme
  const handleReceivedData = (data: any) => {
    try {
      const fileData = JSON.parse(data.toString())
      
      if (fileData.type === 'file-info') {
        // Yeni bir dosya bilgisi alındı
        const newFile: FileInfo = {
          id: fileData.id,
          name: fileData.name,
          size: fileData.size,
          type: fileData.fileType,
          url: `p2p://${fileData.id}`,
          expiryTime: Date.now() + 24 * 60 * 60 * 1000,
          status: 'downloading',
          progress: 0
        }
        setFiles(prev => [...prev, newFile])
        
        // Dosya parçaları için yeni bir giriş oluştur
        setFileChunks(prev => ({
          ...prev,
          [fileData.id]: {
            chunks: [],
            received: 0,
            total: 0
          }
        }))
      } 
      else if (fileData.type === 'file-chunk') {
        // Dosya parçası alındı
        const { id, chunkIndex, totalChunks, data } = fileData
        
        // Parça verilerini Uint8Array'e dönüştür
        const chunkData = new Uint8Array(data)
        
        // Dosya parçalarını güncelle
        setFileChunks(prev => {
          const fileChunk = prev[id] || { chunks: Array(totalChunks).fill(null), received: 0, total: totalChunks }
          
          // Eğer bu parça daha önce alınmadıysa
          if (!fileChunk.chunks[chunkIndex]) {
            const updatedChunks = [...fileChunk.chunks]
            updatedChunks[chunkIndex] = chunkData
            
            const newReceived = fileChunk.received + 1
            
            // İlerleme durumunu güncelle
            const progress = Math.round((newReceived / totalChunks) * 100)
            setFiles(prevFiles => prevFiles.map(file => 
              file.id === id ? { ...file, progress } : file
            ))
            
            return {
              ...prev,
              [id]: {
                chunks: updatedChunks,
                received: newReceived,
                total: totalChunks
              }
            }
          }
          
          return prev
        })
      }
      else if (fileData.type === 'file-complete') {
        // Dosya transferi tamamlandı, parçaları birleştir
        const { id } = fileData
        const fileChunk = fileChunks[id]
        
        if (fileChunk && fileChunk.received === fileChunk.total) {
          // Tüm parçaları birleştir
          let totalLength = 0
          fileChunk.chunks.forEach(chunk => {
            if (chunk) totalLength += chunk.length
          })
          
          const completeFile = new Uint8Array(totalLength)
          let offset = 0
          
          fileChunk.chunks.forEach(chunk => {
            if (chunk) {
              completeFile.set(chunk, offset)
              offset += chunk.length
            }
          })
          
          // Dosya verisini güncelle
          setFiles(prev => prev.map(file => {
            if (file.id === id) {
              return {
                ...file,
                data: completeFile.buffer,
                status: 'completed',
                progress: 100
              }
            }
            return file
          }))
          
          // Parçaları temizle
          setFileChunks(prev => {
            const newChunks = { ...prev }
            delete newChunks[id]
            return newChunks
          })
          
          setAiGuidance(`${files.find(f => f.id === id)?.name || 'Dosya'} başarıyla alındı.`)
          setShowGuidance(true)
        }
      }
      else if (fileData.type === 'file-data') {
        // Eski format dosya verisi (geriye dönük uyumluluk için)
        setFiles(prev => prev.map(file => {
          if (file.id === fileData.id) {
            return {
              ...file,
              data: fileData.data,
              status: 'completed',
              progress: 100
            }
          }
          return file
        }))
      }
    } catch (error) {
      console.error('Error handling received data:', error)
    }
  }
  
  // Peer ID ile bağlantı kurma
  const connectToPeer = () => {
    if (!connectingPeerId) {
      setConnectionError('Bağlanmak için bir Peer ID girmelisiniz')
      return
    }
    
    createPeerConnection(connectingPeerId, true)
    setConnectingPeerId('')
  }
  
  // Signal verisi ile bağlantı kurma
  const connectWithSignal = (signalData: string) => {
    try {
      const data = JSON.parse(signalData)
      const targetPeerId = connectingPeerId || `peer-${Date.now()}`
      
      const peer = createPeerConnection(targetPeerId, false)
      if (peer) {
        peer.signal(data)
      }
    } catch (error: any) {
      setConnectionError(`Geçersiz bağlantı kodu: ${error.message}`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

const handleFileUpload = (fileList: FileList) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 200)

    // Simulate file upload with a delay
    setTimeout(() => {
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const newFiles = Array.from(fileList).map(file => {
        // Generate a random ID for the file
        const id = Math.random().toString(36).substring(2, 15)
        
        // Create a temporary URL for the file (in a real app, this would be a server URL)
        const url = `https://localhost:3000/${id}`
        
        // Set expiry time to 24 hours from now
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000
        
        return {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          expiryTime
        }
      })
      
      setFiles(prev => [...prev, ...newFiles])
      setIsUploading(false)
      setUploadProgress(0)
      
      // Show AI guidance about successful upload
      setAiGuidance("Files uploaded successfully! The links will be valid for 24 hours.")
      setShowGuidance(true)
    }, 2000)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopySuccess(id)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
    setAiGuidance("File removed from sharing. The link is no longer valid.")
    setShowGuidance(true)
  }

  const getRemainingTime = (expiryTime: number): string => {
    const remaining = expiryTime - Date.now()
    if (remaining <= 0) return 'Expired'
    
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m remaining`
  }

  // Dosya gönderme fonksiyonu - Büyük dosyaları parçalara bölerek gönderir
  const sendFile = (file: FileInfo, targetPeerId: string) => {
    try {
      // Hedef peer'ı bul
      const peerConn = peers.find(p => p.id === targetPeerId && p.connected)
      if (!peerConn) {
        setConnectionError(`${targetPeerId} ile bağlantı bulunamadı veya bağlantı kurulmamış.`)
        return
      }

      // Dosya durumunu güncelle
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // Dosya bilgisini gönder
      const fileInfo = {
        type: 'file-info',
        id: file.id,
        name: file.name,
        size: file.size,
        fileType: file.type
      }
      peerConn.peer.send(JSON.stringify(fileInfo))

      // Dosya verisini parçalara bölerek gönderme
      const CHUNK_SIZE = 16 * 1024; // 16KB chunks
      const fileData = file.data as ArrayBuffer;
      const totalChunks = Math.ceil(fileData.byteLength / CHUNK_SIZE);
      
      // Her parçayı gönder
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileData.byteLength);
        const chunk = fileData.slice(start, end);
        
        // Parça verisini gönder
        const chunkData = {
          type: 'file-chunk',
          id: file.id,
          chunkIndex,
          totalChunks,
          data: Array.from(new Uint8Array(chunk))
        };
        
        // Parçayı gönder
        peerConn.peer.send(JSON.stringify(chunkData));
        
        // İlerleme durumunu güncelle
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }
      
      // Dosya gönderiminin tamamlandığını bildir
      const completionData = {
        type: 'file-complete',
        id: file.id
      };
      peerConn.peer.send(JSON.stringify(completionData));
      
      // Dosya durumunu güncelle
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
      ));
      
      setAiGuidance(`${file.name} dosyası ${targetPeerId}'e başarıyla gönderildi.`);
      setShowGuidance(true);
      
    } catch (error: any) {
      console.error('Dosya gönderme hatası:', error);
      setConnectionError(`Dosya gönderme hatası: ${error.message}`);
      
      // Hata durumunda dosya durumunu güncelle
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'failed', progress: 0 } : f
      ));
    }
  }

  // Dosya indirme fonksiyonu
  const downloadFile = (file: FileInfo) => {
    try {
      if (!file.data) {
        setAiGuidance('Bu dosya henüz indirilmemiş veya veri içermiyor.')
        setShowGuidance(true)
        return
      }
      
      // Dosya verisinden Blob oluştur
      const blob = new Blob([file.data], { type: file.type })
      const url = URL.createObjectURL(blob)
      
      // İndirme bağlantısı oluştur ve tıkla
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      
      // Temizlik
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setAiGuidance(`${file.name} dosyası başarıyla indirildi.`)
      setShowGuidance(true)
    } catch (error: any) {
      console.error('Dosya indirme hatası:', error)
      setAiGuidance(`Dosya indirme hatası: ${error.message}`)
      setShowGuidance(true)
    }
  }

  // Dosyaları P2P ile paylaşma
  const shareFilesP2P = (fileList: FileList) => {
    // Dosyaları oku ve state'e ekle
    Array.from(fileList).forEach(file => {
      const fileId = Math.random().toString(36).substring(2, 15)
      
      // Dosya durumunu güncelle
      const fileInfo: FileInfo = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `p2p://${fileId}`,
        expiryTime: Date.now() + 24 * 60 * 60 * 1000,
        status: 'uploading',
        progress: 0
      }
      
      setFiles(prev => [...prev, fileInfo])
      
      // Dosyayı oku
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          // Dosya verisini kaydet
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              data: event.target?.result as ArrayBuffer || new ArrayBuffer(0),
              status: 'completed',
              progress: 100
            } : f
          ))
        }
      }
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ))
        }
      }
      
      reader.readAsArrayBuffer(file)
    })
    
    setAiGuidance('Dosyalar başarıyla yüklendi. Şimdi bir peer ile bağlantı kurarak paylaşabilirsiniz.')
    setShowGuidance(true)
  }

  // Dosya yükleme işleyicisini güncelle
  const handleFiles = (fileList: FileList) => {
    if (peers.some(p => p.connected)) {
      // Eğer bağlı peer varsa, P2P paylaşımı kullan
      shareFilesP2P(fileList)
    } else {
      // Bağlı peer yoksa, normal yükleme simülasyonunu kullan
      setIsUploading(true)
      setUploadProgress(0)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      // Simulate file upload with a delay
      setTimeout(() => {
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        const newFiles = Array.from(fileList).map(file => {
          // Generate a random ID for the file
          const id = Math.random().toString(36).substring(2, 15)
          
          // Create a temporary URL for the file (in a real app, this would be a server URL)
          const url = `https://localhost:3000/${id}`
          
          // Set expiry time to 24 hours from now
          const expiryTime = Date.now() + 24 * 60 * 60 * 1000
          
          return {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            url,
            expiryTime
          }
        })
        
        setFiles(prev => [...prev, ...newFiles])
        setIsUploading(false)
        setUploadProgress(0)
        
        // Show AI guidance about successful upload
        setAiGuidance('Dosyalar başarıyla yüklendi! Bağlantılar 24 saat geçerli olacak.')
        setShowGuidance(true)
      }, 2000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with title */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 p-3 border-b border-cyan-500/30">
        <h2 className="text-cyan-400 font-cyber text-lg">Neural Share</h2>
        <p className="text-cyan-300/70 text-xs">Secure file sharing with neural encryption</p>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* AI Guidance */}
        {showGuidance && (
          <div className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/30 rounded-lg p-3 flex items-start gap-3 mb-4">
            <FaRobot className="text-purple-400 text-xl flex-shrink-0 mt-1" />
            <div>
              <div className="text-purple-300 text-sm">{aiGuidance}</div>
              <button 
                onClick={() => setShowGuidance(false)}
                className="text-purple-400/70 text-xs hover:text-purple-300 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* P2P Connection Section */}
        <div className="mb-4">
          <button 
            onClick={() => setShowPeerSection(!showPeerSection)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 hover:from-purple-800/30 hover:to-cyan-800/30 text-cyan-300 py-2 px-4 rounded-md border border-cyan-500/30 transition-colors mb-2"
          >
            <FaUsers className="text-purple-400" />
            <span>P2P Bağlantı {showPeerSection ? 'Gizle' : 'Göster'}</span>
          </button>
          
          {showPeerSection && (
            <div className="bg-black/30 border border-cyan-800/30 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <h3 className="text-cyan-300 font-cyber text-sm">Senin Peer ID'n</h3>
                  <div className="flex items-center gap-2 bg-black/50 p-2 rounded border border-cyan-800/30">
                    <span className="text-cyan-300 text-sm font-mono">{peerId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(peerId)
                        setAiGuidance('Peer ID kopyalandı!')
                        setShowGuidance(true)
                      }}
                      className="text-cyan-400 hover:text-cyan-300 p-1 rounded hover:bg-cyan-900/20"
                      title="Peer ID'yi kopyala"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className="text-cyan-300 font-cyber text-sm">Peer'a Bağlan</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={connectingPeerId}
                      onChange={(e) => setConnectingPeerId(e.target.value)}
                      placeholder="Peer ID girin"
                      className="flex-1 bg-black/50 border border-cyan-800/30 rounded px-3 py-2 text-cyan-300 placeholder-cyan-700/50 focus:outline-none focus:border-cyan-600"
                    />
                    <button
                      onClick={connectToPeer}
                      className="bg-cyan-800/30 hover:bg-cyan-700/30 text-cyan-300 px-3 py-2 rounded border border-cyan-700/30 transition-colors"
                    >
                      Bağlan
                    </button>
                  </div>
                </div>
              </div>
              
              {isInitiator && (
                <div className="space-y-2">
                  <h3 className="text-cyan-300 font-cyber text-sm">Bağlantı Kodu</h3>
                  <p className="text-cyan-400/70 text-xs">Bu kodu karşı tarafa gönderin ve onların "Bağlantı Kodu ile Bağlan" bölümüne yapıştırmalarını isteyin.</p>
                  <div className="relative">
                    <textarea
                      readOnly
                      className="w-full h-24 bg-black/50 border border-purple-800/30 rounded p-2 text-purple-300 text-xs font-mono focus:outline-none focus:border-purple-600"
                      value={JSON.stringify(peers.find(p => p.id === connectingPeerId)?.peer.signal || {})}
                    />
                    <button
                      onClick={() => {
                        const signalData = JSON.stringify(peers.find(p => p.id === connectingPeerId)?.peer.signal || {})
                        navigator.clipboard.writeText(signalData)
                        setAiGuidance('Bağlantı kodu kopyalandı!')
                        setShowGuidance(true)
                      }}
                      className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-900/20"
                      title="Bağlantı kodunu kopyala"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-cyan-300 font-cyber text-sm">Bağlantı Kodu ile Bağlan</h3>
                <p className="text-cyan-400/70 text-xs">Karşı taraftan aldığınız bağlantı kodunu buraya yapıştırın.</p>
                <div className="relative">
                  <textarea
                    className="w-full h-24 bg-black/50 border border-purple-800/30 rounded p-2 text-purple-300 text-xs font-mono focus:outline-none focus:border-purple-600"
                    placeholder="Bağlantı kodunu buraya yapıştırın..."
                    onChange={(e) => {
                      if (e.target.value) {
                        try {
                          // Sadece geçerli JSON olup olmadığını kontrol et
                          JSON.parse(e.target.value)
                        } catch (error) {
                          setConnectionError('Geçersiz bağlantı kodu. Lütfen tam kodu kopyalayıp yapıştırın.')
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const textarea = e.currentTarget.previousSibling as HTMLTextAreaElement
                      if (textarea.value) {
                        connectWithSignal(textarea.value)
                        textarea.value = ''
                      } else {
                        setConnectionError('Lütfen bir bağlantı kodu girin')
                      }
                    }}
                    className="absolute bottom-2 right-2 bg-purple-800/30 hover:bg-purple-700/30 text-purple-300 px-3 py-1 rounded text-sm border border-purple-700/30 transition-colors"
                  >
                    Bağlan
                  </button>
                </div>
              </div>
              
              {connectionError && (
                <div className="bg-red-900/20 border border-red-800/30 rounded p-2 text-red-300 text-sm">
                  {connectionError}
                </div>
              )}
              
              {peers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-cyan-300 font-cyber text-sm">Bağlı Peer'lar</h3>
                  <div className="space-y-2">
                    {peers.map(peer => (
                      <div key={peer.id} className={`flex justify-between items-center p-2 rounded border ${peer.connected ? 'bg-green-900/10 border-green-800/30' : 'bg-amber-900/10 border-amber-800/30'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${peer.connected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          <span className="text-cyan-300 text-sm">{peer.id}</span>
                        </div>
                        <div className="flex gap-2">
                          {peer.connected && (
                            <button
                              onClick={() => {
                                if (files.length > 0) {
                                  // Dosya seçme modalı göster
                                  const fileToSend = files.find(f => f.data)
                                  if (fileToSend) {
                                    sendFile(fileToSend, peer.id)
                                  } else {
                                    setAiGuidance('Gönderilebilecek dosya bulunamadı. Lütfen önce bir dosya yükleyin.')
                                    setShowGuidance(true)
                                  }
                                } else {
                                  setAiGuidance('Gönderilebilecek dosya bulunamadı. Lütfen önce bir dosya yükleyin.')
                                  setShowGuidance(true)
                                }
                              }}
                              className="bg-cyan-800/30 hover:bg-cyan-700/30 text-cyan-300 px-2 py-1 rounded text-xs border border-cyan-700/30 transition-colors flex items-center gap-1"
                            >
                              <FaExchangeAlt size={10} />
                              Dosya Gönder
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // Peer bağlantısını kapat
                              const peerToDisconnect = peers.find(p => p.id === peer.id)
                              if (peerToDisconnect) {
                                peerToDisconnect.peer.destroy()
                                setPeers(prev => prev.filter(p => p.id !== peer.id))
                                setAiGuidance(`${peer.id} ile bağlantı kapatıldı.`)
                                setShowGuidance(true)
                              }
                            }}
                            className="bg-red-800/30 hover:bg-red-700/30 text-red-300 px-2 py-1 rounded text-xs border border-red-700/30 transition-colors"
                          >
                            Bağlantıyı Kapat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Upload area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-cyan-900/20' : 'border-cyan-600/30 hover:border-cyan-500/50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FaUpload className="text-cyan-400 text-4xl mx-auto mb-4" />
          <h3 className="text-cyan-300 font-cyber mb-2">Upload Files</h3>
          <p className="text-cyan-400/70 text-sm mb-4">Drag & drop files here or click to browse</p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-cyan-800/50 to-purple-800/50 hover:from-cyan-700/50 hover:to-purple-700/50 text-cyan-300 py-2 px-4 rounded-md border border-cyan-500/30 transition-colors"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            className="hidden" 
            multiple 
          />
          
          {isUploading && (
            <div className="mt-4">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-cyan-400/70 text-xs mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>
        
        {/* Shared files list */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-cyan-300 font-cyber mb-3 border-b border-cyan-800/50 pb-2">Shared Files</h3>
            <div className="space-y-3">
              {files.map(file => (
                <div key={file.id} className="bg-black/40 border border-cyan-800/30 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-cyan-300 font-medium truncate">{file.name}</h4>
                      <p className="text-cyan-400/60 text-xs">{formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                      
                      {/* Dosya durumu gösterimi */}
                      {file.status && (
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${file.status === 'completed' 
                                  ? 'bg-green-500' 
                                  : file.status === 'failed' 
                                    ? 'bg-red-500' 
                                    : 'bg-cyan-500'}`}
                                style={{ width: `${file.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs ${file.status === 'completed' 
                              ? 'text-green-400' 
                              : file.status === 'failed' 
                                ? 'text-red-400' 
                                : 'text-cyan-400'}`}>
                              {file.status === 'completed' 
                                ? 'Tamamlandı' 
                                : file.status === 'failed' 
                                  ? 'Başarısız' 
                                  : file.status === 'uploading' 
                                    ? 'Yükleniyor' 
                                    : 'İndiriliyor'} 
                              {file.progress !== undefined && file.progress < 100 && `(${file.progress}%)`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => deleteFile(file.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-full hover:bg-red-900/20 transition-colors"
                        title="Delete file"
                      >
                        <FaTrash size={14} />
                      </button>
                      <button 
                        onClick={() => downloadFile(file)}
                        className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-full hover:bg-cyan-900/20 transition-colors"
                        title="Download file"
                        disabled={!file.data}
                      >
                        <FaDownload size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between bg-black/30 rounded p-2 border border-cyan-800/20">
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      <FaLink className="text-cyan-500 flex-shrink-0" />
                      <span className="text-cyan-300 text-sm truncate">{file.url}</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(file.url, file.id)}
                      className={`ml-2 p-1.5 rounded-full transition-colors ${copySuccess === file.id ? 'bg-green-900/30 text-green-400' : 'hover:bg-cyan-900/20 text-cyan-400 hover:text-cyan-300'}`}
                      title="Copy link"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-amber-400/70 text-xs flex items-center gap-1">
                      <FaInfoCircle size={12} />
                      {getRemainingTime(file.expiryTime)}
                    </span>
                    {copySuccess === file.id && (
                      <span className="text-green-400 text-xs">Link copied!</span>
                    )}
                  </div>
                  
                  {/* P2P Paylaşım Seçenekleri */}
                  {file.data && peers.some(p => p.connected) && (
                    <div className="mt-2 pt-2 border-t border-cyan-800/20">
                      <div className="flex flex-wrap gap-2">
                        {peers.filter(p => p.connected).map(peer => (
                          <button
                            key={peer.id}
                            onClick={() => sendFile(file, peer.id)}
                            className="bg-purple-800/30 hover:bg-purple-700/30 text-purple-300 px-2 py-1 rounded text-xs border border-purple-700/30 transition-colors flex items-center gap-1"
                          >
                            <FaExchangeAlt size={10} />
                            {peer.id}'e Gönder
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
