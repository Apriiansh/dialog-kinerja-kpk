export interface FlatUnit {
  id: number;
  nama_unit: string;
  parent_id: number | null;
}

export interface TreeUnitOption extends FlatUnit {
  depth: number;
}

/**
 * Flattens flat unit rows into depth-first tree order (parents before their
 * children, siblings ordered by nama_unit). Each entry carries its depth so a
 * UI control (e.g. a <select>) can render preserved hierarchy.
 */
export function unitsToTreeOptions(units: FlatUnit[]): TreeUnitOption[] {
  const byParent = new Map<number | null, FlatUnit[]>();
  for (const u of units) {
    const key = u.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(u);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.nama_unit.localeCompare(b.nama_unit, "id"));
  }

  const result: TreeUnitOption[] = [];
  function visit(parentId: number | null, depth: number) {
    const rows = byParent.get(parentId) ?? [];
    for (const u of rows) {
      result.push({ id: u.id, nama_unit: u.nama_unit, parent_id: u.parent_id, depth });
      visit(u.id, depth + 1);
    }
  }
  visit(null, 0);
  return result;
}
