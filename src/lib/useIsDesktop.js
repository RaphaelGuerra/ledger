import { useEffect, useState } from 'react'

// Returns true when viewport width is >= 500px
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia('(min-width: 500px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 500px)')
    const handler = (e) => setIsDesktop(e.matches)
    // modern and legacy listener support
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler)
    else mq.addListener && mq.addListener(handler)
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler)
      else mq.removeListener && mq.removeListener(handler)
    }
  }, [])

  return isDesktop
}
