// robust tenant/session context management and Supabase Auth error handling code
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                setError(error.message);
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