import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
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

test('rewindable reducer', () => {
    const { getByText } = render(<RewindableReducerExample />);

    expect(getByText(/Current Count/i).textContent).toContain(0)
    expect(getByText(/Past States/i).childElementCount).toEqual(0)
  
    fireEvent.click(getByText("Increment"))
    expect(getByText(/Current Count/i).textContent).toContain(1)
    expect(getByText(/Past States/i).childElementCount).toEqual(1)

    fireEvent.click(getByText("Decrement"))
    expect(getByText(/Current Count/i).textContent).toContain(0)
    expect(getByText(/Past States/i).childElementCount).toEqual(2)

    fireEvent.click(getByText("Undo"))
    expect(getByText(/Current Count/i).textContent).toContain(1)
    expect(getByText(/Past States/i).childElementCount).toEqual(1)

    fireEvent.click(getByText("Redo"))
    expect(getByText(/Current Count/i).textContent).toContain(0)
    expect(getByText(/Past States/i).childElementCount).toEqual(2)

    fireEvent.click(getByText("Undo"))
    expect(getByText(/Current Count/i).textContent).toContain(1)
    expect(getByText(/Past States/i).childElementCount).toEqual(1)

    fireEvent.click(getByText("Undo"))
    expect(getByText(/Current Count/i).textContent).toContain(0)
    expect(getByText(/Past States/i).childElementCount).toEqual(0)
})
