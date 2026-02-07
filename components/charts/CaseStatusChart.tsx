"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CaseStatusData {
    name: string;
    value: number;
    color: string;
}

interface CaseStatusChartProps {
    data: CaseStatusData[];
}

export function CaseStatusChart({ data }: CaseStatusChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No case status data available
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
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
