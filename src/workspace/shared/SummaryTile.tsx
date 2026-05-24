type SummaryTileProps = {
  label: string;
  value: string;
  strong?: boolean;
};

export function SummaryTile({ label, value, strong }: SummaryTileProps) {
  return (
    <div className={strong ? "summary-tile strong" : "summary-tile"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
