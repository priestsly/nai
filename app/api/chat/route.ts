import { NextResponse } from 'next/server'
import { HfInference } from '@huggingface/inference'

const hf = new HfInference()

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    // Son kullanıcı mesajını al
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop()

    if (!lastUserMessage) {
      throw new Error('Kullanıcı mesajı bulunamadı')
    }

    // Prompt hazırla
    const prompt = `
      Sen NEON adında, cyberpunk tarzında konuşan bir AI asistansın.
      Kullanıcılara teknik konularda destek veriyorsun.
      Her zaman Türkçe yanıt veriyorsun.
      
      Kullanıcı: ${lastUserMessage.content}
      NEON:`

    // Hugging Face API isteği
    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false
      }
    })

    // Yanıtı temizle ve formatla
    let aiResponse = response.generated_text
      .trim()
      .replace(/^(NEON|Assistant|AI):/, '')
      .trim()

    // Eğer yanıt boşsa
    if (!aiResponse) {
      aiResponse = "Neural Link'te bir dalgalanma oldu. Lütfen sorunuzu tekrar eder misiniz, netrunner?"
    }

    return NextResponse.json({
      response: aiResponse
    })

  } catch (error: any) {
    console.error('API hatası:', error)
    
    const errorMessage = error.message || 'İstek işlenirken bir hata oluştu'
    const statusCode = error.status || 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 