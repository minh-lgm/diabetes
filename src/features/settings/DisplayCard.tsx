import type { GlucoseUnit, Profile } from '../../types'
import { saveProfile } from '../../db'
import { Card, Segmented } from '../../components/ui'

type Theme = Profile['theme']

const UNIT_OPTIONS: { value: GlucoseUnit; label: string }[] = [
  { value: 'mgdl', label: 'mg/dL' },
  { value: 'mmol', label: 'mmol/L' },
]
const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
  { value: 'system', label: 'Theo hệ thống' },
]

export function DisplayCard({ profile }: { profile: Profile }) {
  return (
    <Card title="Hiển thị" subtitle="Thay đổi được áp dụng ngay">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Đơn vị đường huyết</p>
            <p className="text-xs text-muted">Dữ liệu luôn được lưu theo mg/dL; chỉ thay đổi cách hiển thị.</p>
          </div>
          <Segmented value={profile.glucoseUnit} onChange={(v) => void saveProfile({ glucoseUnit: v })} options={UNIT_OPTIONS} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Giao diện</p>
            <p className="text-xs text-muted">Chế độ sáng, tối hoặc theo cài đặt hệ thống.</p>
          </div>
          <Segmented value={profile.theme} onChange={(v) => void saveProfile({ theme: v })} options={THEME_OPTIONS} />
        </div>
      </div>
    </Card>
  )
}
