import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const s = await getSession();
  if (!s) redirect('/login');

  switch (s.role) {
    case 'ADMIN':                redirect('/admin');
    case 'DOCTOR':               redirect('/doctor');
    case 'CONCLUDER':            redirect('/conclude');
    case 'DEPT_REP':             redirect('/dept');
    case 'KTV_XETNGHIEM':        redirect('/paraclinical');
    case 'KTV_CHANDOANHINHANH':  redirect('/paraclinical');
    case 'VITAL_STAFF':          redirect('/vital');
    default:                     redirect('/me');
  }
}
