export function ProductCardSkeleton() {
  return (
    <div className="bg-[#111] rounded-lg overflow-hidden border border-[#1A1A1A]">
      <div className="skeleton aspect-square" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function TextSkeleton({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />;
}

export function OrderRowSkeleton() {
  return (
    <tr className="border-b border-[#1A1A1A]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3 px-4"><div className="skeleton h-4 w-24 rounded" /></td>
      ))}
    </tr>
  );
}
