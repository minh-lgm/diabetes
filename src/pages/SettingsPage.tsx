import { useProfile } from '../hooks/useProfile'
import { PageHeader } from '../components/ui'
import { ProfileCard } from '../features/settings/ProfileCard'
import { DisplayCard } from '../features/settings/DisplayCard'
import { TargetsCard } from '../features/settings/TargetsCard'
import { DataCard } from '../features/settings/DataCard'
import { AboutCard } from '../features/settings/AboutCard'

export default function SettingsPage() {
  const profile = useProfile()
  return (
    <div>
      <PageHeader title="Cài đặt" description="Hồ sơ, hiển thị, ngưỡng mục tiêu và dữ liệu" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-5">
          <ProfileCard profile={profile} />
          <DisplayCard profile={profile} />
          <DataCard />
          <AboutCard />
        </div>
        <div className="space-y-5">
          <TargetsCard profile={profile} />
        </div>
      </div>
    </div>
  )
}
