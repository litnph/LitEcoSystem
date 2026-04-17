import type { Transaction } from '../../../entities'
import { currencyVnd, formatISODateToVi } from '../../../shared/lib/format'

type StatementTableProps = {
  rows: Transaction[]
  selectedIds: Record<string, boolean>
  onToggle: (id: string) => void
}

export function StatementTable({ rows, selectedIds, onToggle }: StatementTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#9E8E7C]">
        Không có giao dịch
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[640px]">
        <thead>
          <tr>
            <th className="data-th w-10"></th>
            <th className="data-th">Ngày</th>
            <th className="data-th">Merchant</th>
            <th className="data-th">Danh mục</th>
            <th className="data-th text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const selected = selectedIds[item.id] ?? false
            return (
              <tr
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`cursor-pointer transition ${
                  selected ? 'data-tr-selected' : 'data-tr'
                }`}
              >
                <td className="data-td w-10">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${
                      selected
                        ? 'border-[#7A5E3E] bg-[#7A5E3E]'
                        : 'border-[#D4C9BE] bg-white'
                    }`}
                    onClick={(e) => { e.stopPropagation(); onToggle(item.id) }}
                  >
                    {selected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                </td>
                <td className="data-td text-xs text-[#9E8E7C]">
                  {formatISODateToVi(item.occurredAt)}
                </td>
                <td className="data-td font-medium text-[#2C2215]">{item.merchant}</td>
                <td className="data-td">
                  <span className="badge-slate">{item.category}</span>
                </td>
                <td className="data-td text-right font-semibold text-[#2C2215]">
                  {currencyVnd(item.amount)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
