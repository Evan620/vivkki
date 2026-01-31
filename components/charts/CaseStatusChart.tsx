"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
    { name: "Active", value: 24, color: "#2563eb" }, // bright blue
    { name: "Awaiting B&R", value: 17, color: "#3b82f6" }, // blue-500
    { name: "Counter Sent", value: 9, color: "#60a5fa" }, // blue-400
    { name: "Demand Sent", value: 6, color: "#93c5fd" }, // blue-300
    { name: "Negotiating", value: 4, color: "#c4b5fd" }, // violet-300
    { name: "New", value: 3, color: "#a78bfa" }, // violet-400
    { name: "Others", value: 6, color: "#e4e4e7" }, // gray-200
];

export function CaseStatusChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "0.5rem", color: "#fafafa" }}
                        itemStyle={{ color: "#fafafa" }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
