import { useUserProgressContext } from '../contexts/UserProgressContext';

// Facade Hook: Redirects legacy calls to the new Global Context
export const useUserProgress = () => {
    return useUserProgressContext();
};
