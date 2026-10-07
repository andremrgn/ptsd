<template>
  <svg
    class="pixel-icon"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${width} ${height}`"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    <rect v-for="(r, i) in rects" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.fill" />
  </svg>
</template>

<script setup lang="ts">
// 16×16 Win98-ikoner tegnet som pikselkart: # = svart kant, o = hvit flate.
// (Erstatter fargeemoji, som Win98 ikke hadde og som 98.css-knapper tegner ulikt.)
const THUMBS_UP = [
  '................',
  '.......##.......',
  '......#oo#......',
  '......#oo#......',
  '.....#ooo#......',
  '....#ooo#.......',
  '####oooo#######.',
  '#oo#oooooooooo#.',
  '#oo#ooooo######.',
  '#oo#oooooooooo#.',
  '#oo#ooooo#####..',
  '#oo#ooooooooo#..',
  '#oo#ooooo####...',
  '#oo#oooooooo#...',
  '############....',
  '................',
]

const ICONS: Record<string, string[]> = {
  thumbsUp: THUMBS_UP,
  thumbsDown: [...THUMBS_UP].reverse(),
}
const COLORS: Record<string, string> = { '#': '#000', o: '#fff' }

const props = withDefaults(defineProps<{ name: keyof typeof ICONS; size?: number }>(), { size: 16 })

const rows = computed(() => ICONS[props.name] || [])
const width = computed(() => rows.value[0]?.length || 16)
const height = computed(() => rows.value.length || 16)

// Slå sammen like piksler på samme rad til ett rektangel
const rects = computed(() => {
  const out: { x: number; y: number; w: number; fill: string }[] = []
  rows.value.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const fill = COLORS[row[x]]
      if (!fill) { x++; continue }
      let end = x
      while (end < row.length && row[end] === row[x]) end++
      out.push({ x, y, w: end - x, fill })
      x = end
    }
  })
  return out
})
</script>
