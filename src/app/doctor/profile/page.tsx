import { getCurrentUser, requireAuth } from '@/lib/auth';
import DoctorProfileClient from './client';

export default async function DoctorProfilePage() {
  await requireAuth(['DOCTOR']);
  const user = await getCurrentUser();
  return (
    <DoctorProfileClient
      fullName={user?.fullName ?? ''}
      email={user?.email ?? ''}
      jobTitle={user?.jobTitle ?? ''}
      savedSignature={user?.signatureDataUrl ?? null}
      caUserId={user?.caUserId ?? null}
      caSerialNumber={user?.caSerialNumber ?? null}
      caEnabled={user?.caEnabled ?? false}
    />
  );
}
