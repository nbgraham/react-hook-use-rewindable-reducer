import { useCallback, useMemo } from 'react'
import { useResumableReducer } from './use_resumable_reducer';

const rewindableActionCreator = (name: string) => {
    const type = `@@${name}@@`;
    const action = { type };
    const isActionType = (action: any): action is typeof action =>
        action instanceof Object && 'type' in action && action.type === type;
    return {
        action,
        isActionType
    };
}

const UNDO = rewindableActionCreator('UNDO');
const REDO = rewindableActionCreator('REDO');
const RESET = rewindableActionCreator('RESET');

type RewindableReducerState<S, A> = {
    pastActions: A[]
    pastStates: S[]
    currentState: S
    futureActions: A[]
    futureStates: S[]
}
type RewindableReducerAction<A> = A | typeof UNDO.action | typeof RESET.action;

export type SaveOptions<S, A> = {
    saveKey: string;
    serializeState: (state: S) => string;
    deserializeState: (ser: string) => S;
    serializeAction: (action: A) => string;
    deserializeAction: (ser: string) => A;
    saveValue: (key: string, value: string) => void;
    retrieveValue: (key: string) => string | null;
}

export const useRewindableReducer = <S, A>(reducer: (state: S, action: A) => S, initialState: S, saveOptions?: Partial<SaveOptions<S, A>>) => {

    const initialRewindableState: RewindableReducerState<S, A> = useMemo(() => ({
        pastActions: [],
        pastStates: [],
        currentState: initialState,
        futureActions: [],
        futureStates: [],
    }), [initialState]);

    const rewindableReducer = useCallback(
        (state: RewindableReducerState<S, A>, action: RewindableReducerAction<A>): RewindableReducerState<S, A> => {
            if (UNDO.isActionType(action)) {
                if (state.pastStates.length === 0) {
                    return state;
                }
                const prevState = state.pastStates[state.pastStates.length - 1];
                const prevAction = state.pastActions[state.pastActions.length - 1];
                return {
                    pastActions: state.pastActions.slice(0, -1),
                    pastStates: state.pastStates.slice(0, -1),
                    currentState: prevState,
                    futureActions: [prevAction, ...state.futureActions],
                    futureStates: [state.currentState, ...state.futureStates],
                };
            } else if (REDO.isActionType(action)) {
                if (state.futureStates.length === 0) {
                    return state;
                }
                const nextState = state.futureStates[0];
                const nextAction = state.futureActions[0];
                return {
                    pastActions: [...state.pastActions, nextAction],
                    pastStates: [...state.pastStates, state.currentState],
                    currentState: nextState,
                    futureActions: state.futureActions.slice(1),
                    futureStates: state.futureStates.slice(1),
                };
            } else if (RESET.isActionType(action)) {
                return initialRewindableState;
            } else {
                const nextState = reducer(state.currentState, action);
                return {
                    pastActions: [...state.pastActions, action],
                    pastStates: [...state.pastStates, state.currentState],
                    currentState: nextState,
                    futureActions: [],
                    futureStates: [],
                };
            }
        },
        [reducer, initialRewindableState]
    )

    const { saveState, retrieveState } = useMemo(
        () => getSaveAndRetrieveFunctions(saveOptions),
        [saveOptions]
    )

    const [state, dispatch] = useResumableReducer(
        rewindableReducer,
        initialRewindableState,
        saveState,
        retrieveState
    );

    const undo = useCallback(() => dispatch(UNDO.action), [dispatch])
    const redo = useCallback(() => dispatch(REDO.action), [dispatch])
    const reset = useCallback(() => dispatch(RESET.action), [dispatch])
    const externalDispatch = useCallback((action: A) => dispatch(action), [dispatch]);

    return {
        state: state.currentState,
        dispatch: externalDispatch,
        pastActions: state.pastActions,
        undo,
        redo,
        reset
    }
}

const getSaveAndRetrieveFunctions = <S, A>(saveOptions?: Partial<SaveOptions<S, A>>) => {
    const _saveOptions = saveOptions && {
        saveKey: getNextSaveId(),
        serializeState: JSON.stringify,
        deserializeState: JSON.parse,
        serializeAction: JSON.stringify,
        deserializeAction: JSON.parse,
        saveValue: defaultSaveItem,
        retrieveValue: defaultRetrieveItem,
        ...saveOptions,
    } as SaveOptions<S, A>

    const saveKey = _saveOptions?.saveKey;
    const save = _saveOptions?.saveValue;
    const retrieve = _saveOptions?.retrieveValue
    const saveState = _saveOptions && save && ((state: RewindableReducerState<S, A>) => {
        save(`${saveKey}__pastActions`, JSON.stringify(state.pastActions.map(_saveOptions.serializeAction)));
        save(`${saveKey}__pastStates`, JSON.stringify(state.pastStates.map(_saveOptions.serializeState)));
        save(`${saveKey}__currentState`, _saveOptions.serializeState(state.currentState));
        save(`${saveKey}__futureActions`, JSON.stringify(state.futureActions.map(_saveOptions.serializeAction)));
        save(`${saveKey}__futureStates`, JSON.stringify(state.futureStates.map(_saveOptions.serializeState)));
    })
    const retrieveState = _saveOptions && retrieve && ((): RewindableReducerState<S, A> | undefined => {
        const pastActionsSer = retrieve(`${saveKey}__pastActions`);
        const pastStatesSer = retrieve(`${saveKey}__pastStates`);
        const currentStateSer = retrieve(`${saveKey}__currentState`);
        const futureActionsSer = retrieve(`${saveKey}__futureActions`);
        const futureStatesSer = retrieve(`${saveKey}__futureStates`);
        return !!pastActionsSer && !!pastStatesSer && !!currentStateSer && !!futureActionsSer && !!futureStatesSer ? {
            pastActions: (JSON.parse(pastActionsSer) as string[]).map(s => _saveOptions.deserializeAction(s)),
            pastStates: (JSON.parse(pastStatesSer) as string[]).map(s => _saveOptions.deserializeState(s)),
            currentState: _saveOptions.deserializeState(currentStateSer),
            futureActions: (JSON.parse(futureActionsSer) as string[]).map(s => _saveOptions.deserializeAction(s)),
            futureStates: (JSON.parse(futureStatesSer) as string[]).map(s => _saveOptions.deserializeState(s)),
        } as RewindableReducerState<S, A> : undefined;
    })

    return { saveState, retrieveState };
}

const defaultSaveItem = (key: string, value: string) => sessionStorage.setItem(key, value);
const defaultRetrieveItem = (key: string) => sessionStorage.getItem(key);

let saveId = 0;
const getNextSaveId = () => `${saveId++}`;