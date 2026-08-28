export function countCapaian(
  aspek: {item: { is_tercapai: boolean | null }[] } [],
): { tercapai: number; belum: number } {

  const items = aspek.flatMap((a) => a.item)
  return {
    tercapai: items.filter((i) => i.is_tercapai === true).length,
    belum: items.filter((i) => i.is_tercapai === false).length,
  };

}
