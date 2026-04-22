import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const e = await prisma.employee.update({
      where: { id: params.id },
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);

    // Kiểm tra nếu nhân viên có hồ sơ khám thì không cho xóa (hoặc cho cascade)
    const recordCount = await prisma.healthRecord.count({ where: { employeeId: params.id } });
    if (recordCount > 0) {
      // Cho phép xóa cascade: xóa hồ sơ khám liên quan trước
      await prisma.healthRecord.deleteMany({ where: { employeeId: params.id } });
    }

    await prisma.employee.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
