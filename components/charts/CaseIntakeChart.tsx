"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CaseIntakeData {
    name: string;
    cases: number;
}

interface CaseIntakeChartProps {
    data: CaseIntakeData[];
}

export function CaseIntakeChart({ data }: CaseIntakeChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No intake data available
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
