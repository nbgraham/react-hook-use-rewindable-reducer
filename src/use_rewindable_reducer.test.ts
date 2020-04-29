import { renderHook, act } from '@testing-library/react-hooks'
import { useRewindableReducer } from './use_rewindable_reducer'

const countReducer = (count: number, action: 'increment' | 'decrement') =>
    action === 'increment' ? count + 1 :
        action === 'decrement' ? count - 1 :
            count

test('can undo after one', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.dispatch('increment')
    })
    expect(result.current.state).toBe(1);
    expect(result.current.pastActions).toEqual(['increment']);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
})

test('history limits past actions', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0, { historyLimit: 5 }));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        for (let i = 0; i < 10; i++) {
            result.current.dispatch('increment')
        }
    })

    expect(result.current.state).toBe(10);
    expect(result.current.pastActions).toHaveLength(5);
    expect(result.current.pastStates).toHaveLength(5);
})

test('history limits future actions', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0, { historyLimit: 5 }));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        for (let i = 0; i < 10; i++) {
            result.current.dispatch('increment')
        }
    })

    act(() => {
        for (let i = 0; i < 8; i++) {
            result.current.undo();
        }
    })

    expect(result.current.state).toBe(5);
    expect(result.current.futureActions).toHaveLength(5);
    expect(result.current.futureStates).toHaveLength(5);
})

test('can undo after three then reset', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.dispatch('increment')
        result.current.dispatch('increment')
        result.current.dispatch('increment')
    })
    expect(result.current.state).toBe(3);
    expect(result.current.pastActions).toEqual(['increment', 'increment', 'increment']);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(2);
    expect(result.current.pastActions).toEqual(['increment', 'increment']);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(1);
    expect(result.current.pastActions).toEqual(['increment']);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.redo()
    })
    expect(result.current.state).toBe(1);
    expect(result.current.pastActions).toEqual(['increment']);
    act(() => {
        result.current.redo()
    })
    expect(result.current.state).toBe(2);
    expect(result.current.pastActions).toEqual(['increment', 'increment']);
    act(() => {
        result.current.redo()
    })
    expect(result.current.state).toBe(3);
    expect(result.current.pastActions).toEqual(['increment', 'increment', 'increment']);
    act(() => {
        result.current.reset()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
})

test('undo does nothing at start', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
})

test('redo does nothing at start', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.redo()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
})

test('reset does nothing at start', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]); act(() => {
        result.current.reset()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
})

test('redo does nothing after undo and then another action', () => {
    const { result } = renderHook(() => useRewindableReducer(countReducer, 0));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.dispatch('increment')
    })
    expect(result.current.state).toBe(1);
    expect(result.current.pastActions).toEqual(['increment']);
    act(() => {
        result.current.undo()
    })
    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.dispatch('decrement')
    })
    expect(result.current.state).toBe(-1);
    expect(result.current.pastActions).toEqual(['decrement']);
    act(() => {
        result.current.redo()
    })
    expect(result.current.state).toBe(-1);
    expect(result.current.pastActions).toEqual(['decrement']);
})

test('resume', () => {
    let savedValues: { [key: string]: string } = {}
    const saveValue = (key: string, value: string) => savedValues[key] = value
    const retrieveValue = (key: string) => savedValues[key]

    const { result } = renderHook(() => useRewindableReducer(countReducer, 0, { persist: { saveKey: 'test', saveValue, retrieveValue } }));

    expect(result.current.state).toBe(0);
    expect(result.current.pastActions).toEqual([]);
    act(() => {
        result.current.dispatch('increment')
    })
    expect(result.current.state).toBe(1);
    expect(result.current.pastActions).toEqual(['increment']);

    const { result: result1 } = renderHook(() => useRewindableReducer(countReducer, 0, { persist: { saveKey: 'test', saveValue, retrieveValue } }));
    expect(result1.current.state).toBe(1);
    expect(result1.current.pastActions).toEqual(['increment']);
})