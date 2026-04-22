import { getCurrentUser, requireAuth } from '@/lib/auth';
import DoctorProfileClient from '@/app/doctor/profile/client';

export default async function ConcluderProfilePage() {
  await requireAuth(['CONCLUDER']);
  const user = await getCurrentUser();
  return (
    <DoctorProfileClient
  fullName={user?.fullName ?? ''}
  email={user?.email ?? ''}
  jobTitle={user?.jobTitle ?? ''}
  savedSignature={null}
  caUserId={user?.caUserId ?? ''}
  caSerialNumber={user?.caSerialNumber ?? ''}
  caEnabled={user?.caEnabled ?? false}
/>
  );
}
