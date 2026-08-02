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

const titleAt = (index: number) => screen.queryAllByTestId('todo-title')[index] as HTMLElement
const editBox = () => screen.getByTestId('todo-edit') as HTMLInputElement
const noEditBox = () => screen.queryByTestId('todo-edit')
const storedTitles = () =>
  (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as { title: string }[]).map(
    (todo) => todo.title,
  )

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

describe('편집 [CHANGE]', () => {
  const setup = async () => {
    render(<App />)
    await add('a')
    await add('b')
  }

  it('U40/U41/U43: 더블클릭 전에는 편집창이 없고, 더블클릭하면 그 항목 안에 현재 제목이 담긴 편집창이 하나 생긴다', async () => {
    await setup()
    expect(noEditBox()).toBeNull()

    await user.dblClick(titleAt(0))
    expect(screen.queryAllByTestId('todo-edit')).toHaveLength(1)
    expect(within(items()[0]).getByTestId('todo-edit')).toBe(editBox())
    expect(editBox().value).toBe('a')
    expect(editBox().type).toBe('text')
  })

  it('U44: 편집창에 포커스가 가고 캐럿은 값의 끝에 놓인다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    expect(document.activeElement).toBe(editBox())
    expect(editBox().selectionStart).toBe(1)
    expect(editBox().selectionEnd).toBe(1)
  })

  it('U45: 편집 중에도 todo-title은 DOM에 남고, 확정 전까지 원래 제목이며 hidden이다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '고친 제목')

    expect(titles()).toEqual(['a', 'b'])
    expect(titleAt(0).hidden).toBe(true)
    expect(titleAt(1).hidden).toBe(false)
  })

  it('U46/U47/U48: Enter로 확정하면 trim한 제목만 바뀌고 완료 상태·순서는 그대로다', async () => {
    await setup()
    await user.click(toggles()[0]) // a = 완료
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '  우유  사기  {Enter}')

    expect(titles()).toEqual(['우유  사기', 'b'])
    expect(toggles()[0].checked).toBe(true)
    expect(toggles()[1].checked).toBe(false)
    expect(noEditBox()).toBeNull()
    expect(titleAt(0).hidden).toBe(false)
  })

  it('U42: 다른 항목 제목을 더블클릭하면 편집 대상이 옮겨간다 (편집창은 항상 하나)', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.dblClick(titleAt(1))

    expect(screen.queryAllByTestId('todo-edit')).toHaveLength(1)
    expect(within(items()[1]).getByTestId('todo-edit')).toBe(editBox())
    expect(editBox().value).toBe('b')
  })

  it('U49: 빈 제목으로 확정하면 제목을 바꾸지 않고 편집만 끝낸다 (삭제하지 않는다)', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '   {Enter}')

    expect(items()).toHaveLength(2)
    expect(titles()).toEqual(['a', 'b'])
    expect(noEditBox()).toBeNull()
  })

  it('U50: Escape는 입력을 버리고 편집을 끝낸다. 다시 열면 원래 제목이 담긴다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '버릴 값{Escape}')

    expect(titles()).toEqual(['a', 'b'])
    expect(noEditBox()).toBeNull()

    await user.dblClick(titleAt(0))
    expect(editBox().value).toBe('a')
  })

  it('U51: IME 조합 중의 Enter는 확정하지 않는다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '한글')

    fireEvent.keyDown(editBox(), { key: 'Enter', isComposing: true })
    expect(titles()).toEqual(['a', 'b'])
    expect(noEditBox()).not.toBeNull()

    fireEvent.keyDown(editBox(), { key: 'Enter' })
    expect(titles()).toEqual(['한글', 'b'])
  })

  it('U52: 포커스를 잃으면 확정이 아니라 취소로 끝난다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '확정 안 될 값')
    await user.click(input()) // 편집창 밖으로 포커스 이동

    expect(titles()).toEqual(['a', 'b'])
    expect(noEditBox()).toBeNull()
  })

  it('U53: 편집 중인 항목을 삭제하면 편집도 끝나고 다른 항목이 편집 상태가 되지 않는다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.click(screen.queryAllByTestId('todo-delete')[0])

    expect(titles()).toEqual(['b'])
    expect(noEditBox()).toBeNull()
  })

  it('U54: 편집 중에도 추가·토글·삭제·필터가 그대로 동작한다', async () => {
    await setup()
    await user.dblClick(titleAt(0))

    await add('c')
    expect(titles()).toEqual(['a', 'b', 'c'])
    await user.click(toggles()[1])
    expect(count()).toBe('2')
    await user.click(screen.getByTestId('filter-completed'))
    expect(titles()).toEqual(['b'])
    await user.click(screen.queryAllByTestId('todo-delete')[0])
    expect(items()).toHaveLength(0)
  })

  it('U55: 확정한 제목은 저장되어 다시 렌더해도 남는다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '고침{Enter}')
    cleanup()

    render(<App />)
    expect(titles()).toEqual(['고침', 'b'])
  })

  it('U56: 미확정 draft는 저장되지 않는다', async () => {
    await setup()
    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '저장되면 안 되는 값')

    expect(storedTitles()).toEqual(['a', 'b'])
  })

  it('U57: 제목 한 번 클릭은 편집도 토글도 아니다', async () => {
    await setup()
    await user.click(titleAt(0))

    expect(noEditBox()).toBeNull()
    expect(toggles()[0].checked).toBe(false)
  })

  it('U58: 완료된 항목도 편집할 수 있고 편집은 미완료 개수를 바꾸지 않는다', async () => {
    await setup()
    await user.click(toggles()[0]) // a = 완료
    expect(count()).toBe('1')

    await user.dblClick(titleAt(0))
    await user.clear(editBox())
    await user.type(editBox(), '완료된 것 고치기{Enter}')

    expect(titles()).toEqual(['완료된 것 고치기', 'b'])
    expect(toggles()[0].checked).toBe(true)
    expect(count()).toBe('1')
  })

  it('U59: 편집해도 필터 선택은 그대로고 항목이 화면에서 사라지지 않는다', async () => {
    await setup()
    await user.click(screen.getByTestId('filter-active'))
    await user.dblClick(titleAt(1))
    await user.clear(editBox())
    await user.type(editBox(), 'B{Enter}')

    expect(screen.getByTestId('filter-active').getAttribute('aria-pressed')).toBe('true')
    expect(titles()).toEqual(['a', 'B'])
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
