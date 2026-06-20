import { Direction, Position, Difficulty, BotStyle } from './game-types'

export type CellState = 0 | 1 | 2 | 3 | 4 | 5 // empty, player, bot1, obstacle, bot2, bot3

const DIRS: Direction[] = ['up', 'down', 'left', 'right']
const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const DX: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 }
const DY: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 }

function isValid(x: number, y: number, size: number, grid: CellState[][]): boolean {
  return x >= 0 && x < size && y >= 0 && y < size && (grid?.[y]?.[x] ?? 1) === 0
}

function getValidMoves(pos: Position, size: number, grid: CellState[][], currentDir: Direction): Direction[] {
  return DIRS.filter(d => d !== OPPOSITE[currentDir] && isValid(pos.x + DX[d], pos.y + DY[d], size, grid))
}

function floodFill(startX: number, startY: number, size: number, grid: CellState[][]): number {
  const visited = new Set<number>()
  const stack = [startX + startY * size]
  let count = 0
  while (stack.length > 0) {
    const key = stack.pop()!
    if (visited.has(key)) continue
    const x = key % size
    const y = Math.floor(key / size)
    if (x < 0 || x >= size || y < 0 || y >= size) continue
    if ((grid?.[y]?.[x] ?? 1) !== 0) continue
    visited.add(key)
    count++
    if (count > 200) return count // early exit for perf on big grids
    stack.push((x + 1) + y * size, (x - 1) + y * size, x + (y + 1) * size, x + (y - 1) * size)
  }
  return count
}

function evaluateMove(dir: Direction, botPos: Position, playerPos: Position, size: number, grid: CellState[][]): number {
  const nx = botPos.x + DX[dir]
  const ny = botPos.y + DY[dir]
  if (!isValid(nx, ny, size, grid)) return -9999
  const simGrid = grid.map(row => [...(row ?? [])])
  simGrid[ny][nx] = 2
  return floodFill(nx, ny, size, simGrid)
}

export function getBotMove(
  botPos: Position,
  botDir: Direction,
  playerPos: Position,
  size: number,
  grid: CellState[][],
  difficulty: Difficulty,
  botStyle: BotStyle,
  isFrozen?: boolean
): Direction {
  // If frozen, just go straight (or a valid direction)
  if (isFrozen) {
    const nx = botPos.x + DX[botDir]
    const ny = botPos.y + DY[botDir]
    if (isValid(nx, ny, size, grid)) return botDir
    const valid = getValidMoves(botPos, size, grid, botDir)
    return valid.length > 0 ? valid[0] : botDir
  }

  const validMoves = getValidMoves(botPos, size, grid, botDir)
  if (validMoves.length === 0) return botDir
  if (validMoves.length === 1) return validMoves[0]

  // Easy: random with mistakes
  if (difficulty === 'easy' && Math.random() < 0.4) {
    return validMoves[Math.floor(Math.random() * validMoves.length)]
  }

  const scored = validMoves.map(dir => {
    let score = evaluateMove(dir, botPos, playerPos, size, grid)
    const nx = botPos.x + DX[dir]
    const ny = botPos.y + DY[dir]

    if (botStyle === 'aggressive' || (botStyle === 'unpredictable' && Math.random() > 0.5)) {
      const distBefore = Math.abs(botPos.x - playerPos.x) + Math.abs(botPos.y - playerPos.y)
      const distAfter = Math.abs(nx - playerPos.x) + Math.abs(ny - playerPos.y)
      if (distAfter < distBefore) score += 3
    }

    if (botStyle === 'defensive' || (botStyle === 'unpredictable' && Math.random() > 0.5)) {
      const simGrid = grid.map(row => [...(row ?? [])])
      simGrid[ny][nx] = 2
      const playerSpace = floodFill(playerPos.x, playerPos.y, size, simGrid)
      score += Math.max(0, (size * size / 4) - playerSpace) * 0.3
    }

    return { dir, score }
  })

  scored.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))

  if (difficulty === 'easy' && Math.random() < 0.3 && scored.length > 1) return scored[1].dir
  if (difficulty === 'medium' && Math.random() < 0.15 && scored.length > 1) return scored[Math.floor(Math.random() * scored.length)].dir
  if (difficulty === 'hard' && Math.random() < 0.05 && scored.length > 1) return scored[1].dir

  return scored[0].dir
}
