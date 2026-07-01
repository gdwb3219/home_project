import { useCallback, useState } from 'react'

export function useDragReorder(onMove) {
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [draggingIndex, setDraggingIndex] = useState(null)

  const handleMove = useCallback(
    (fromIndex, toIndex) => {
      onMove(fromIndex, toIndex)
      setDragOverIndex(null)
      setDraggingIndex(null)
    },
    [onMove],
  )

  const getRowClassName = useCallback(
    (index, baseClass) => {
      const classes = [baseClass]
      if (draggingIndex === index) classes.push('is-dragging')
      if (dragOverIndex === index && draggingIndex !== index) classes.push('drag-over')
      return classes.join(' ')
    },
    [dragOverIndex, draggingIndex],
  )

  const getRowProps = useCallback(
    (index) => ({
      onDragOver: (event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setDragOverIndex(index)
      },
      onDragLeave: () => {
        setDragOverIndex((current) => (current === index ? null : current))
      },
      onDrop: (event) => {
        event.preventDefault()
        const fromIndex = Number(event.dataTransfer.getData('text/plain'))
        if (!Number.isNaN(fromIndex)) {
          handleMove(fromIndex, index)
        }
      },
    }),
    [handleMove],
  )

  const getHandleProps = useCallback(
    (index) => ({
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
        setDraggingIndex(index)
      },
      onDragEnd: () => {
        setDraggingIndex(null)
        setDragOverIndex(null)
      },
    }),
    [],
  )

  return { getRowClassName, getRowProps, getHandleProps }
}
