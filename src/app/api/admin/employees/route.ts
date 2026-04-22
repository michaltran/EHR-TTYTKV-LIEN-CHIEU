import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const e = await prisma.employee.create({
      data: {
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        idNumber: data.idNumber || null,
        idIssuedDate: data.idIssuedDate ? new Date(data.idIssuedDate) : null,
        idIssuedPlace: data.idIssuedPlace || null,
        phone: data.phone || null,
        currentAddress: data.currentAddress || null,
        occupation: data.occupation || null,
        workplace: data.workplace || null,
        startWorkingDate: data.startWorkingDate ? new Date(data.startWorkingDate) : null,
        position: data.position || null,
        departmentId: data.departmentId,
        employmentType: data.employmentType || null,
        qualification: data.qualification || null,
        jobTitle: data.jobTitle || null,
        photoUrl: data.photoUrl || null,
        familyHistory: data.familyHistory || null,
        signatureUrl: data.signatureUrl || null,
        previousJobs: data.previousJobs || null,
        personalHistory: data.personalHistory || null,
      },
    });
    return NextResponse.json(e);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
