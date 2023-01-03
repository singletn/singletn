export default function getTraces() {
  function trimEx(string: string, matchStart: string | string[], matchEnd: string | string[]) {
    var len = matchStart.length
    if (!Array.isArray(matchStart)) {
      matchStart = matchStart.split('')
      matchEnd = (matchEnd as string).split('')
    }
    matchEnd = (matchEnd as string[]).reverse()
    var i
    var clean = false
    var end = string.length - 1
    var start = 0
    while (clean === false) {
      clean = true
      for (i = 0; i < len; i++) {
        if (string[start] === matchStart[i] && string[end] === matchEnd[i]) {
          clean = false
          ++start
          --end
          continue // optional
        }
      }
    }
    return string.substring(start, ++end)
  }

  const lines = new Error()?.stack?.split(/\s\s\s+/)

  return (lines || []).reduce((acc, line) => {
    var split = line.split(/\s+/)
    if (split.length < 2) return acc
    if (split.shift() !== 'at') return acc // Epic fail inevitable

    var source = trimEx((split || ['']).pop() || '', '(', ')')
      .split(/([:\d]+$)/)
      .slice(0, 2)
    var __ = source[1].substr(1).split(/:/)
    var trace: any = {
      src: trimEx(source[0], '<', '>'),
      line: __[0],
      char: __[1],
    }

    if (split.length) {
      __ = (split || []).shift()?.split('.') || []
      trace.function = __.pop() || ''
      trace.object = __ || ''
    }

    acc.push(trace)

    return acc
  }, [] as any[])
}
