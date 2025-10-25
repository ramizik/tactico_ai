/**
 * Session Context for Team Management
 * Manages current team selection and persists to localStorage
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { teamsApi } from '../lib/api';
import type { Team } from '../types/api';

interface SessionContextType {
    currentTeam: Team | null;
    setCurrentTeam: (team: Team | null) => void;
    teamId: string | null;
    isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load team from localStorage on mount
    useEffect(() => {
        const loadTeam = async () => {
            const savedTeamId = localStorage.getItem('tactico_team_id');
            if (savedTeamId) {
                try {
                    const team = await teamsApi.getById(savedTeamId);
                    setCurrentTeam(team);
                } catch (error) {
                    console.error('Failed to load saved team:', error);
                    localStorage.removeItem('tactico_team_id');
                }
            }
            setIsLoading(false);
        };
        loadTeam();
    }, []);

    // Save team to localStorage when it changes
    useEffect(() => {
        if (currentTeam) {
            localStorage.setItem('tactico_team_id', currentTeam.id);
        } else {
            localStorage.removeItem('tactico_team_id');
        }
    }, [currentTeam]);

    return (
        <SessionContext.Provider value={{
            currentTeam,
            setCurrentTeam,
            teamId: currentTeam?.id || null,
            isLoading
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within SessionProvider');
    return context;
};
