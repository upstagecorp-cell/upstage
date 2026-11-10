import { AccountRecovery } from '@/components/workspace/AccountRecovery'
export const metadata = { title: 'Choose a new password', robots: { index: false, follow: false } }
export default function Page(){return <AccountRecovery purpose="reset"/>}
