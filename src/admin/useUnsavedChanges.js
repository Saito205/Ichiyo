import { useEffect } from 'react'
export default function useUnsavedChanges(dirty, onDirtyChange) {
  useEffect(() => {
    onDirtyChange?.(dirty)
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (dirty) window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      onDirtyChange?.(false)
    }
  }, [dirty, onDirtyChange])
}
