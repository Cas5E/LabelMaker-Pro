import QRCode from 'qrcode'

export async function makeQrDataUrl(payload: string): Promise<string> {
  const text = payload.trim() || 'EMPTY'
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
    color: {
      dark: '#0a0f1a',
      light: '#ffffff',
    },
  })
}
