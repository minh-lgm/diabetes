import { ShieldCheck, HardDrive, Stethoscope } from 'lucide-react'
import { Card } from '../../components/ui'

export const APP_VERSION = '1.0.0'

export function AboutCard() {
  return (
    <Card title="Về ứng dụng" subtitle={`Theo dõi tiểu đường · phiên bản ${APP_VERSION}`}>
      <ul className="space-y-3 text-sm">
        <li className="flex gap-3">
          <HardDrive size={18} className="shrink-0 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Dữ liệu chỉ lưu trên thiết bị này</p>
            <p className="text-muted">Toàn bộ dữ liệu được lưu trong trình duyệt bạn đang dùng (IndexedDB), không gửi lên máy chủ nào. Nếu bạn xoá dữ liệu trang web, đổi trình duyệt hoặc thiết bị, dữ liệu sẽ mất – hãy <b className="text-fg">xuất bản sao lưu định kỳ</b>.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <ShieldCheck size={18} className="shrink-0 text-ok mt-0.5" />
          <div>
            <p className="font-medium">Riêng tư</p>
            <p className="text-muted">Ứng dụng không yêu cầu tài khoản và không theo dõi người dùng.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <Stethoscope size={18} className="shrink-0 text-warn mt-0.5" />
          <div>
            <p className="font-medium">Lưu ý y khoa</p>
            <p className="text-muted">Ứng dụng chỉ hỗ trợ ghi chép và theo dõi, không thay thế chẩn đoán hay điều trị của bác sĩ. Các ngưỡng tham khảo dựa trên ADA Standards of Care, ESC/ESH và KDIGO; mục tiêu điều trị của mỗi người có thể khác. Hãy trao đổi với bác sĩ trước khi thay đổi thuốc hoặc chế độ điều trị.</p>
          </div>
        </li>
      </ul>
    </Card>
  )
}
