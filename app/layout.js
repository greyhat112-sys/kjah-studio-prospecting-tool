import './globals.css'

export const metadata = {
  title: 'KJAH Prospecting',
  description: 'Internal prospecting tool',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
