'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function ReportsChart({
  classData, statusData, bmiData, deptData,
}: {
  classData: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
  bmiData: { name: string; value: number }[];
  deptData: { dept: string; total: number; completed: number }[];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Phân loại sức khỏe</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={classData} dataKey="value" nameKey="name" outerRadius={80} label>
              {classData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Trạng thái hồ sơ</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Phân bố BMI</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bmiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="value" fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Tiến độ theo khoa/phòng</h3>
        <ResponsiveContainer width="100%" height={Math.max(240, deptData.length * 22)}>
          <BarChart data={deptData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="dept" fontSize={10} width={140} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#cbd5e1" name="Tổng" />
            <Bar dataKey="completed" fill="#10b981" name="Hoàn tất" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
