import { useReducer } from 'react';

export const useResumableReducer = <S, A>(reducer: (state: S, action: A) => S, initialState: S, saveState?: (state: S) => void, retrieveState?: () => S | undefined) => {
    function resumableReducer(state: S, action: A) {
        const nextState = reducer(state, action);
        saveState && saveState(nextState);
        return nextState;
    }
    const retrievedState = retrieveState && retrieveState();
    return useReducer(resumableReducer, retrievedState || initialState);
}