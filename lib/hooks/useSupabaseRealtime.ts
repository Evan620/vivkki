"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseSupabaseRealtimeOptions<T> {
    table: string;
    filter?: { column: string; value: any };
    initialData?: T[];
    enabled?: boolean;
}

export function useSupabaseRealtime<T>({
    table,
    filter,
    initialData = [],
    enabled = true,
}: UseSupabaseRealtimeOptions<T>) {
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // Set up channel name
        const channelName = `${table}-realtime-${filter?.column || 'all'}-${filter?.value || 'all'}`;

        // Create subscription
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
                },
                (payload) => {
                    console.log(`Realtime update on ${table}:`, payload);

                    if (payload.eventType === 'INSERT') {
                        setData((prev) => [...prev, payload.new as T]);
                    } else if (payload.eventType === 'UPDATE') {
                        setData((prev) =>
                            prev.map((item) =>
                                (item as any).id === (payload.old as any).id ? payload.new as T : item
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setData((prev) =>
                            prev.filter((item) => (item as any).id !== (payload.old as any).id)
                        );
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Realtime subscription status for ${table}:`, status);
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, filter, enabled]);

    const refresh = useCallback(async (queryFn: () => Promise<T[]>) => {
        setLoading(true);
        try {
            const result = await queryFn();
            setData(result);
        } catch (error) {
            console.error(`Error refreshing ${table}:`, error);
        } finally {
            setLoading(false);
        }
    }, [table]);

    return { data, loading, refresh, setData };
}

// Hook for casefiles table specifically
export function useCasefileRealtime(casefileId: string, enabled = true) {
    const [casefile, setCasefile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled || !casefileId) return;

        const channel = supabase
            .channel(`casefile-${casefileId}-realtime`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'casefiles',
                    filter: `id=eq.${casefileId}`,
                },
                async (payload) => {
                    console.log('Casefile updated:', payload);
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        setCasefile(payload.new);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Casefile realtime status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [casefileId, enabled]);

    const refresh = useCallback(async (fetchFn: () => Promise<any>) => {
        setLoading(true);
        try {
            const result = await fetchFn();
            setCasefile(result);
        } catch (error) {
            console.error('Error refreshing casefile:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { casefile, loading, refresh, setCasefile };
}
