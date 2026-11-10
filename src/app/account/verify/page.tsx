import { AccountRecovery } from '@/components/workspace/AccountRecovery'
export const metadata = { title: 'Verify your email', robots: { index: false, follow: false } }
export default function Page(){return <AccountRecovery purpose="verify"/>}
