'use client';

import { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Settings className="w-8 h-8" />
                        Settings
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Account Settings */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Account</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-muted-foreground cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-sm font-medium text-foreground">Email Notifications</span>
                                    <p className="text-xs text-muted-foreground">Receive email updates about your cases</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="text-sm font-medium text-foreground">Case Updates</span>
                                    <p className="text-xs text-muted-foreground">Get notified when cases are updated</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">Security</h2>
                        </div>
                        <div className="space-y-4">
                            <button
                                onClick={() => window.location.href = '/auth/update-password'}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Database className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">System Information</h2>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Version</span>
                                <span className="text-foreground">1.0.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Environment</span>
                                <span className="text-foreground">Development</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                            {saved ? (
                                <>
                                    <span>✓ Saved</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
