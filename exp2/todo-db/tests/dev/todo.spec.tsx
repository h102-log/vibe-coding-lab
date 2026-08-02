/**
 * SPEC.md §2에서 [추론]으로 확정한 문장들을 지키는 테스트.
 * 인수 테스트(tests/ac/**)가 무엇을 검사하는지는 알 수 없으므로,
 * 계약이 침묵해서 내가 정한 동작이 나중에 조용히 뒤집히지 않게 여기서 고정한다.
 * 각 테스트 이름 앞의 U번호가 SPEC.md의 문장 번호다.
 *
 * 실행: npm run test:dev
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { STORAGE_KEY } from '../../src/storage'
import { createTodo, reserveIds } from '../../src/todos'

const input = () => screen.getByTestId('todo-input') as HTMLInputElement
const items = () => screen.queryAllByTestId('todo-item')
const titles = () => screen.queryAllByTestId('todo-title').map((el) => el.textContent)
const count = () => screen.getByTestId('todo-count').textContent
const toggles = () => screen.queryAllByTestId('todo-toggle') as HTMLInputElement[]

const user = userEvent.setup()
const add = async (text: string) => {
  await user.type(input(), `${text}{Enter}`)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('추가', () => {
  it('U2/U3: Enter 한 번은 항목을 정확히 하나 추가한다 (form submit과 중복되지 않는다)', async () => {
    render(<App />)
    await add('a')
    expect(titles()).toEqual(['a'])
  })

  it('U3: form submit 경로로도 추가된다', async () => {
    render(<App />)
    await user.type(input(), 'a')
    const form = input().closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)
    expect(titles()).toEqual(['a'])
    expect(input().value).toBe('')
  })

  it('U4: 앞뒤 공백은 제거하고 내부 공백은 보존한다', async () => {
    render(<App />)
    await add('   우유  사기   ')
    expect(titles()).toEqual(['우유  사기'])
  })

  it('U5/U7: 공백뿐이면 추가하지 않고 입력값도 비우지 않는다', async () => {
    render(<App />)
    await add('   ')
    expect(items()).toHaveLength(0)
    expect(input().value).toBe('   ')
  })

  it('U6: 추가에 성공하면 입력창을 비운다', async () => {
    render(<App />)
    await add('a')
    expect(input().value).toBe('')
  })

  it('U8: 새 항목은 목록 끝에 붙는다', async () => {
    render(<App />)
    await add('a')
    await add('b')
    await add('c')
    expect(titles()).toEqual(['a', 'b', 'c'])
  })

  it('U9: 같은 제목도 별개 항목으로 추가된다', async () => {
    render(<App />)
    await add('a')
    await add('a')
    expect(items()).toHaveLength(2)
  })

  it('U10: 새 항목은 미완료 상태다', async () => {
    render(<App />)
    await add('a')
    expect(toggles()[0].checked).toBe(false)
    expect(count()).toBe('1')
  })

  it('U12: IME 조합 중의 Enter는 추가하지 않는다', async () => {
    render(<App />)
    await user.type(input(), '한글')
    fireEvent.keyDown(input(), { key: 'Enter', isComposing: true })
    expect(items()).toHaveLength(0)
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(titles()).toEqual(['한글'])
  })
})

describe('항목', () => {
  it('U14: 토글·제목·삭제는 자기 todo-item의 자손이다', async () => {
    render(<App />)
    await add('a')
    const item = items()[0]
    expect(within(item).getByTestId('todo-toggle')).toBeDefined()
    expect(within(item).getByTestId('todo-title')).toBeDefined()
    expect(within(item).getByTestId('todo-delete')).toBeDefined()
  })

  it('U15/U19: 제목 텍스트는 제목과 정확히 같고 완료해도 변하지 않는다', async () => {
    render(<App />)
    await add('a')
    expect(screen.getByTestId('todo-title').textContent).toBe('a')
    await user.click(toggles()[0])
    expect(screen.getByTestId('todo-title').textContent).toBe('a')
  })

  it('U16/U17: 토글은 자기 항목만 반전시킨다', async () => {
    render(<App />)
    await add('a')
    await add('b')
    await user.click(toggles()[0])
    expect(toggles()[0].checked).toBe(true)
    expect(toggles()[1].checked).toBe(false)
    await user.click(toggles()[0])
    expect(toggles()[0].checked).toBe(false)
  })

  it('U18: 삭제는 그 항목만 지우고 나머지 순서를 유지한다', async () => {
    render(<App />)
    await add('a')
    await add('b')
    await add('c')
    await user.click(screen.queryAllByTestId('todo-delete')[1])
    expect(titles()).toEqual(['a', 'c'])
  })
})

describe('미완료 개수', () => {
  it('U20/U21: 항목이 없어도 렌더되고 텍스트는 숫자뿐이다', () => {
    render(<App />)
    expect(count()).toBe('0')
  })

  it('U23/U24: 추가·토글·삭제 직후 값이 갱신된다', async () => {
    render(<App />)
    await add('a')
    await add('b')
    expect(count()).toBe('2')
    await user.click(toggles()[0])
    expect(count()).toBe('1')
    await user.click(toggles()[1])
    expect(count()).toBe('0')
    await user.click(screen.queryAllByTestId('todo-delete')[0])
    expect(count()).toBe('0')
  })

  it('U22: 필터를 바꿔도 전체 목록 기준 미완료 개수를 센다', async () => {
    render(<App />)
    await add('a')
    await add('b')
    await user.click(toggles()[0])
    await user.click(screen.getByTestId('filter-completed'))
    expect(count()).toBe('1')
    await user.click(screen.getByTestId('filter-active'))
    expect(count()).toBe('1')
  })
})

describe('필터', () => {
  const setup = async () => {
    render(<App />)
    await add('a')
    await add('b')
    await user.click(toggles()[0]) // a = 완료
  }

  it('U25/U26: 초기 필터는 전체이고 전체 항목을 보여준다', async () => {
    await setup()
    expect(titles()).toEqual(['a', 'b'])
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true')
  })

  it('U27: 미완료 필터는 완료 항목을 DOM에서 제거한다', async () => {
    await setup()
    await user.click(screen.getByTestId('filter-active'))
    expect(titles()).toEqual(['b'])
  })

  it('U28: 완료 필터는 완료 항목만 남긴다', async () => {
    await setup()
    await user.click(screen.getByTestId('filter-completed'))
    expect(titles()).toEqual(['a'])
  })

  it('U29: 필터가 걸린 상태에서 토글하면 조건에 안 맞는 즉시 사라진다', async () => {
    await setup()
    await user.click(screen.getByTestId('filter-active'))
    await user.click(toggles()[0]) // b 완료 처리
    expect(items()).toHaveLength(0)
  })

  it('U30/U33: 필터는 추가·삭제 후에도 유지되고, 추가는 필터와 무관하게 반영된다', async () => {
    await setup()
    await user.click(screen.getByTestId('filter-completed'))
    await add('c')
    expect(titles()).toEqual(['a']) // c는 미완료라 보이지 않는다
    expect(count()).toBe('2')
    await user.click(screen.getByTestId('filter-all'))
    expect(titles()).toEqual(['a', 'b', 'c'])
  })

  it('U31/U32: 선택된 필터도 다시 누를 수 있고 aria-pressed로 선택을 드러낸다', async () => {
    await setup()
    const active = screen.getByTestId('filter-active')
    await user.click(active)
    await user.click(active)
    expect(active.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByTestId('filter-completed').getAttribute('aria-pressed')).toBe('false')
    expect(titles()).toEqual(['b'])
  })
})

describe('지속성', () => {
  it('U36/U37: 다시 렌더하면 제목과 완료 상태가 복원된다', async () => {
    render(<App />)
    await add('A')
    await add('B')
    await user.click(toggles()[0])
    cleanup()

    render(<App />)
    expect(titles()).toEqual(['A', 'B'])
    expect(toggles()[0].checked).toBe(true)
    expect(toggles()[1].checked).toBe(false)
    expect(count()).toBe('1')
  })

  it('U34: 저장된 것이 없으면 빈 목록으로 시작한다', () => {
    render(<App />)
    expect(items()).toHaveLength(0)
  })

  it('U36: 저장값이 깨져 있으면 던지지 않고 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEY, '{ 이건 JSON이 아니다')
    render(<App />)
    expect(items()).toHaveLength(0)
  })

  it('U36: 항목 모양이 아닌 원소는 걸러낸다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'todo-1', title: 'ok', completed: false }, { nope: true }, 42]),
    )
    render(<App />)
    expect(titles()).toEqual(['ok'])
  })

  it('U39: 필터 선택은 저장하지 않는다 (다시 열면 전체)', async () => {
    render(<App />)
    await add('a')
    await user.click(toggles()[0])
    await user.click(screen.getByTestId('filter-active'))
    expect(items()).toHaveLength(0)
    cleanup()

    render(<App />)
    expect(titles()).toEqual(['a'])
    expect(screen.getByTestId('filter-all').getAttribute('aria-pressed')).toBe('true')
  })

  it('U38: 복원된 id 뒤로 카운터를 밀어 올려 id가 겹치지 않는다', () => {
    reserveIds([{ id: 'todo-9000', title: 'x', completed: false }])
    const next = createTodo('y')
    expect(next.id).toBe('todo-9001')
    expect(createTodo('z').id).toBe('todo-9002')
  })
})
