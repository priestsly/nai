import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const rajdhani = Rajdhani({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani'
})

export const metadata = {
  title: 'NeuroGrid OS',
  description: 'Cyber Interface v2.3.1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <head>
        <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js" defer />
      </head>
      <body className="font-rajdhani bg-cyber-dark text-cyber-primary overflow-hidden">
          {children}
      </body>
    </html>
  )
}