/** 배열 내 항목 순서 변경 (섹션 내 드래그 정렬용) */
export function reorderList(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list
  if (fromIndex >= list.length || toIndex >= list.length) return list

  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
