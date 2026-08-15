import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        <svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="22" fill="#1c1a17" />
          <path
            d="M24 24 L76 24 L76 62 L62 76 L24 76 Z"
            fill="none"
            stroke="#B8935A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M76 62 L76 76 L62 76 Z" fill="#B8935A" />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 61,
            fontWeight: 600,
            color: '#B8935A',
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  )
}
