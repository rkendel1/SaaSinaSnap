// Client-side tenant provider for React context
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from './supabaseClient';

// Types
interface TenantContextType {
  tenant: any | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Client-side React Context Provider
export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
    const [tenant, setTenant] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const { data, error } = await supabase
                    .from('tenants')
                    .select('*')
                    .single();

                if (error) throw error;

                setTenant(data);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};