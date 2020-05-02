# Rewindable Reducer React Hook

## Quickstart
`npm i use-rewindable-reducer`

```tsx
import * as React from 'react';
import { useRewindableReducer } from './use_rewindable_reducer';

const countReducer = (count: number, action: 'increment' | 'decrement') =>
    action === 'increment' ? count + 1 :
        action === 'decrement' ? count - 1 :
            count

const RewindableReducerExample = () => {
    const { state, dispatch, undo, redo, pastStates } = useRewindableReducer(countReducer, 0);

    return (
        <div>
            Current Count: {state}
            <button onClick={() => dispatch('increment')}>Increment</button>
            <button onClick={() => dispatch('decrement')}>Decrement</button>
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
            <div>
                Past States
                {pastStates.map((s, i) => <div key={i}>{s}</div>)}
            </div>
        </div>
    )
}
```

## Options
```ts
export type Options<S = null, A = null> = {
    historyLimit: number
    persist: Partial<PersistOptions<S, A>>
}

export type PersistOptions<S, A> = {
    saveKey: string;
    serializeState: (state: S) => string;
    deserializeState: (ser: string) => S;
    serializeAction: (action: A) => string;
    deserializeAction: (ser: string) => A;
    saveValue: (key: string, value: string) => void;
    retrieveValue: (key: string) => string | null;
}
```
### History limit
Can provide `historyLimit` to limit the number of past and future actions that are stored.  
### Persist
Can also provide a save key and optional serialization/save functions so that the reducer state (and history) will persist across refreshes.  
This will default to `JSON.stringify` and `JSON.parse` and setting items in session storage.
