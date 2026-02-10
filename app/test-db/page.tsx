"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Loader2, Database, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

interface TestResult {
    name: string;
    status: "pending" | "running" | "success" | "error";
    message: string;
    details?: string;
}

export default function DatabaseTestPage() {
    const [testResults, setTestResults] = useState<TestResult[]>([
        { name: "Supabase Connection", status: "pending", message: "Waiting..." },
        { name: "Authentication Check", status: "pending", message: "Waiting..." },
        { name: "READ: List Cases", status: "pending", message: "Waiting..." },
        { name: "READ: Get Single Case", status: "pending", message: "Waiting..." },
        { name: "WRITE: Insert Work Log", status: "pending", message: "Waiting..." },
        { name: "UPDATE: Modify Work Log", status: "pending", message: "Waiting..." },
        { name: "DELETE: Remove Test Data", status: "pending", message: "Waiting..." },
    ]);
    const [isRunning, setIsRunning] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    const updateResult = (index: number, updates: Partial<TestResult>) => {
        setTestResults(prev => prev.map((result, i) =>
            i === index ? { ...result, ...updates } : result
        ));
    };

    const runTests = async () => {
        setIsRunning(true);
        setUserInfo(null);

        // Test 1: Supabase Connection
        updateResult(0, { status: "running", message: "Testing connection..." });
        try {
            const { data, error } = await supabase.from('casefiles').select('count').limit(1);
            if (error) throw error;
            updateResult(0, { status: "success", message: "Connected!", details: `Found casefiles table` });
        } catch (error: any) {
            updateResult(0, { status: "error", message: "Connection failed", details: error.message });
            setIsRunning(false);
            return;
        }

        // Test 2: Authentication Check
        updateResult(1, { status: "running", message: "Checking auth status..." });
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            if (user) {
                setUserInfo(user);
                updateResult(1, {
                    status: "success",
                    message: "Authenticated!",
                    details: `Logged in as: ${user.email}`
                });
            } else {
                updateResult(1, {
                    status: "error",
                    message: "Not authenticated",
                    details: "You need to log in for WRITE operations to work"
                });
            }
        } catch (error: any) {
            updateResult(1, { status: "error", message: "Auth check failed", details: error.message });
        }

        // Test 3: READ - List Cases
        updateResult(2, { status: "running", message: "Fetching cases..." });
        try {
            const { data, error } = await supabase
                .from('casefiles')
                .select('id, status, stage')
                .limit(5);
            if (error) throw error;
            updateResult(2, {
                status: "success",
                message: `Found ${data?.length || 0} cases`,
                details: data?.map((c: any) => `Case #${c.id} (${c.status})`).join(', ') || 'No cases'
            });
        } catch (error: any) {
            updateResult(2, { status: "error", message: "READ failed", details: error.message });
        }

        // Get first case ID for subsequent tests
        let testCaseId: number | null = null;
        try {
            const { data } = await supabase.from('casefiles').select('id').limit(1).single();
            testCaseId = data?.id;
        } catch (e) {
            // No cases exist
        }

        // Test 4: READ - Get Single Case
        updateResult(3, { status: "running", message: "Fetching single case..." });
        if (testCaseId) {
            try {
                const { data, error } = await supabase
                    .from('casefiles')
                    .select('*')
                    .eq('id', testCaseId)
                    .single();
                if (error) throw error;
                updateResult(3, {
                    status: "success",
                    message: "Retrieved case details",
                    details: `Case #${data.id}: ${data.status || 'No status'}`
                });
            } catch (error: any) {
                updateResult(3, { status: "error", message: "Single read failed", details: error.message });
            }
        } else {
            updateResult(3, {
                status: "error",
                message: "Skipped",
                details: "No cases exist to test with"
            });
        }

        // Test 5: WRITE - Insert Work Log
        updateResult(4, { status: "running", message: "Creating test work log..." });
        let testLogId: string | null = null;
        if (testCaseId) {
            try {
                const testPayload = {
                    casefile_id: testCaseId,
                    description: `Database connectivity test - ${new Date().toISOString()}`,
                    user_name: "System Test",
                    timestamp: new Date().toISOString()
                };

                const { data, error } = await supabase
                    .from('work_logs')
                    .insert([testPayload])
                    .select('id')
                    .single();

                if (error) {
                    // Check if it's an auth error
                    if (error.message?.includes('permission') || error.code === '42501') {
                        throw new Error("Permission denied - You need to be authenticated to insert data");
                    }
                    throw error;
                }

                testLogId = data?.id;
                updateResult(4, {
                    status: "success",
                    message: "Work log created!",
                    details: `ID: ${testLogId}`
                });
            } catch (error: any) {
                updateResult(4, {
                    status: "error",
                    message: "INSERT failed",
                    details: error.message
                });
            }
        } else {
            updateResult(4, {
                status: "error",
                message: "Skipped",
                details: "No casefile to link test data to"
            });
        }

        // Test 6: UPDATE - Modify Work Log
        updateResult(5, { status: "running", message: "Updating test work log..." });
        if (testLogId) {
            try {
                const { error } = await supabase
                    .from('work_logs')
                    .update({ description: `Database connectivity test - UPDATED - ${new Date().toISOString()}` })
                    .eq('id', testLogId);

                if (error) throw error;
                updateResult(5, { status: "success", message: "Work log updated!" });
            } catch (error: any) {
                updateResult(5, { status: "error", message: "UPDATE failed", details: error.message });
            }
        } else {
            updateResult(5, {
                status: "error",
                message: "Skipped",
                details: "Previous test failed - nothing to update"
            });
        }

        // Test 7: DELETE - Remove Test Data
        updateResult(6, { status: "running", message: "Cleaning up test data..." });
        if (testLogId) {
            try {
                const { error } = await supabase
                    .from('work_logs')
                    .delete()
                    .eq('id', testLogId);

                if (error) throw error;
                updateResult(6, { status: "success", message: "Test data deleted!" });
            } catch (error: any) {
                updateResult(6, { status: "error", message: "DELETE failed", details: error.message });
            }
        } else {
            updateResult(6, {
                status: "error",
                message: "Skipped",
                details: "No test data to delete"
            });
        }

        setIsRunning(false);
    };

    const getStatusIcon = (status: TestResult["status"]) => {
        switch (status) {
            case "pending":
                return <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />;
            case "running":
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case "success":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "error":
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-background p-8" suppressHydrationWarning>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database className="w-8 h-8" />
                        Database Connectivity Test
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        This page tests your Supabase backend connection and CRUD operations.
                    </p>
                </div>

                {/* Auth Status */}
                <div className="mb-8 p-6 rounded-xl border bg-card">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {userInfo ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        Authentication Status
                    </h2>
                    {userInfo ? (
                        <div className="text-sm">
                            <p className="font-medium text-green-600 dark:text-green-400">✓ You are logged in</p>
                            <p className="text-muted-foreground mt-1">
                                Email: {userInfo.email}<br />
                                ID: {userInfo.id}
                            </p>
                        </div>
                    ) : (
                        <div className="text-sm">
                            <p className="font-medium text-yellow-600 dark:text-yellow-400">
                                ⚠ Not authenticated - WRITE operations will fail
                            </p>
                            <a href="/login" className="text-primary hover:underline mt-2 inline-block">
                                Go to Login →
                            </a>
                        </div>
                    )}
                </div>

                {/* Run Test Button */}
                <div className="mb-8 flex gap-4">
                    <button
                        onClick={runTests}
                        disabled={isRunning}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Running Tests...
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5" />
                                Run All Tests
                            </>
                        )}
                    </button>
                </div>

                {/* Test Results */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold mb-4">Test Results</h2>
                    {testResults.map((result, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{result.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            result.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                            result.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                            result.status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                            "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                        }`}>
                                            {result.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">{result.message}</p>
                                    {result.details && (
                                        <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">
                                            {result.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-8 p-4 rounded-lg border bg-muted/30">
                    <h3 className="font-semibold mb-2">Test Legend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li><strong className="text-green-500">Success</strong> - Operation completed successfully</li>
                        <li><strong className="text-red-500">Error</strong> - Operation failed (check details)</li>
                        <li><strong className="text-gray-500">Pending</strong> - Test waiting to run</li>
                        <li><strong className="text-blue-500">Running</strong> - Test in progress</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
