// Sanity-checks every generated puzzle: bounds, crossing consistency,
// connectivity, numbering, and determinism across two generations.
import { getPuzzles, getPuzzle } from '../lib/puzzles';

let failures = 0;
const fail = (msg: string) => { failures++; console.error('FAIL:', msg); };

const puzzles = getPuzzles();
console.log(`Generated ${puzzles.length} puzzles`);

for (const p of puzzles) {
  const { id, grid, clues, size } = p;

  if (grid.length !== size || grid.some(row => row.length !== size)) fail(`${id}: grid is not ${size}x${size}`);

  for (const c of clues) {
    if (!/^[A-Z]{3,}$/.test(c.answer)) fail(`${id}/${c.id}: bad answer "${c.answer}"`);
    for (let i = 0; i < c.length; i++) {
      const r = c.direction === 'across' ? c.row : c.row + i;
      const cc = c.direction === 'across' ? c.col + i : c.col;
      const cell = grid[r]?.[cc];
      if (!cell) { fail(`${id}/${c.id}: out of bounds at ${r},${cc}`); continue; }
      if (cell.isBlack) fail(`${id}/${c.id}: covers black cell ${r},${cc}`);
      if (cell.letter !== c.answer[i]) fail(`${id}/${c.id}: letter conflict at ${r},${cc}: grid="${cell.letter}" word="${c.answer[i]}"`);
    }
    if (!grid[c.row][c.col].number) fail(`${id}/${c.id}: start cell has no number`);
  }

  // Every white cell must belong to at least one word
  for (const cell of grid.flat()) {
    if (!cell.isBlack && !cell.acrossId && !cell.downId) fail(`${id}: orphan white cell ${cell.row},${cell.col}`);
    if (!cell.isBlack && !cell.letter) fail(`${id}: white cell without letter ${cell.row},${cell.col}`);
  }

  // Connectivity: all words reachable from the first via shared cells
  const cellOwners = new Map<string, string[]>();
  for (const c of clues) {
    for (let i = 0; i < c.length; i++) {
      const r = c.direction === 'across' ? c.row : c.row + i;
      const cc = c.direction === 'across' ? c.col + i : c.col;
      const k = `${r},${cc}`;
      cellOwners.set(k, [...(cellOwners.get(k) ?? []), c.id]);
    }
  }
  const adj = new Map<string, Set<string>>();
  for (const owners of cellOwners.values()) {
    for (const a of owners) for (const b of owners) {
      if (a !== b) (adj.get(a) ?? adj.set(a, new Set()).get(a)!).add(b);
    }
  }
  const seen = new Set<string>([clues[0].id]);
  const stack = [clues[0].id];
  while (stack.length) {
    for (const nb of adj.get(stack.pop()!) ?? []) {
      if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
    }
  }
  if (seen.size !== clues.length) fail(`${id}: grid not connected (${seen.size}/${clues.length})`);

  // No duplicate answers
  const answers = clues.map(c => c.answer);
  if (new Set(answers).size !== answers.length) fail(`${id}: duplicate answers`);

  console.log(`  ${id}: ${size}x${size}, ${clues.length} words ${clues.length < 8 ? '(LOW!)' : ''}`);
  if (clues.length < 8) fail(`${id}: too few words`);
}

// Determinism: regenerating by id must give identical grids
for (const p of puzzles) {
  const again = getPuzzle(p.id)!;
  const flat = (x: typeof p) => x.grid.flat().map(c => `${c.letter}|${c.isBlack}|${c.number ?? ''}`).join(';');
  if (flat(p) !== flat(again)) fail(`${p.id}: non-deterministic generation`);
}

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nAll puzzles valid ✔');
