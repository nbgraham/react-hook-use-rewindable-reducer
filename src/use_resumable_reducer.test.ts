import { renderHook, act } from '@testing-library/react-hooks';
import { useResumableReducer } from './use_resumable_reducer';

const countReducer = (count: number, action: 'increment' | 'decrement') =>
    action === 'increment' ? count + 1 :
        action === 'decrement' ? count - 1 :
            count

const STATE = 0;
const DISPATCH = 1;

test('saved state: resume', () => {
    let savedState = 99
    const saveState = (state: number) => { savedState = state }
    const retrieveState = () => savedState

    const { result } = renderHook(() => useResumableReducer(countReducer, 0, saveState, retrieveState));

    expect(result.current[STATE]).toBe(99);
    act(() => {
        result.current[DISPATCH]('increment')
    })
    expect(result.current[STATE]).toBe(100);
})

test('empty state: save and resume', () => {
    let savedState: number | undefined
    const saveState = (state: number) => { savedState = state }
    const retrieveState = () => savedState

    const { result } = renderHook(() => useResumableReducer(countReducer, 0, saveState, retrieveState));

    expect(result.current[STATE]).toBe(0);
    act(() => {
        result.current[DISPATCH]('increment')
    })
    expect(result.current[STATE]).toBe(1);

    const { result: result2 } = renderHook(() => useResumableReducer(countReducer, 0, saveState, retrieveState));
    expect(result2.current[STATE]).toBe(1);
})