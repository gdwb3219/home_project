function DragHandle({ handleProps }) {
  return (
    <button
      type="button"
      className="btn-icon drag-handle"
      aria-label="순서 변경 (드래그)"
      title="드래그하여 순서 변경"
      {...handleProps}
    >
      <span className="drag-handle-icon" aria-hidden="true">
        ☰
      </span>
    </button>
  )
}

export function SortableRowActions({ onRemove, handleProps }) {
  return (
    <>
      <button type="button" className="btn-icon" onClick={onRemove} aria-label="행 삭제">
        ✕
      </button>
      <DragHandle handleProps={handleProps} />
    </>
  )
}

export function SortableHeaderActions() {
  return (
    <>
      <span className="row-action-spacer" aria-hidden="true" />
      <span className="row-action-spacer" aria-hidden="true" />
    </>
  )
}
