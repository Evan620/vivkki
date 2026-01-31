"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
    { name: "Aug 2025", cases: 25 },
    { name: "Sep 2025", cases: 35 },
    { name: "Oct 2025", cases: 15 },
    { name: "Nov 2025", cases: 30 },
    { name: "Dec 2025", cases: 32 },
    { name: "Jan 2026", cases: 28 },
];

export function CaseIntakeChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: "#27272a", opacity: 0.5 }}
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "0.5rem", color: "#fafafa" }}
                    />
                    <Bar dataKey="cases" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
