/**
 * TagInput — 렌더 구조·제거 버튼·빈 목록 표시를 지키는 테스트.
 *
 * 이 저장소에는 SPEC.md가 없다. 아래 요구는 구현 의뢰문에 적힌 문장을 그대로 옮긴 것이다.
 *
 * 요구 1: "텍스트 입력창 1개와 추가된 태그 목록을 렌더한다."
 * 요구 4: "각 태그 옆에 제거 버튼이 있고, 누르면 그 태그만 목록에서 사라진다(숨김이 아니라 언렌더)."
 * 요구 5: "태그가 0개일 때는 목록 대신 '태그 없음' 텍스트를 렌더한다."
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagInput from './TagInput'

afterEach(cleanup)

/** 태그 하나를 입력해 추가한다. */
async function addTag(user: ReturnType<typeof userEvent.setup>, tag: string) {
  await user.type(screen.getByRole('textbox'), `${tag}{Enter}`)
}

/** 주어진 태그의 목록 항목(li)을 찾는다. */
function itemFor(tag: string) {
  const item = screen.getAllByRole('listitem').find((li) => li.textContent?.includes(tag))
  if (!item) throw new Error(`"${tag}" 태그 항목을 찾지 못했다`)
  return item
}

describe('TagInput: 렌더 구조', () => {
  it('요구 1: 텍스트 입력창을 정확히 1개 렌더한다', () => {
    render(<TagInput />)

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
  })

  it('요구 1: 추가된 태그를 목록으로 렌더한다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await addTag(user, 'react')
    await addTag(user, 'vite')

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent?.includes('react') || li.textContent?.includes('vite'))).toEqual([true, true])
  })
})

describe('TagInput: 빈 목록 표시', () => {
  it('요구 5: 태그가 0개면 "태그 없음"을 렌더하고 목록은 렌더하지 않는다', () => {
    render(<TagInput />)

    expect(screen.getByText('태그 없음')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('요구 5: 태그가 생기면 "태그 없음"은 사라지고, 모두 지우면 다시 나타난다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await addTag(user, 'react')
    expect(screen.queryByText('태그 없음')).toBeNull()
    expect(screen.getByRole('list')).toBeTruthy()

    await user.click(within(itemFor('react')).getByRole('button'))
    expect(screen.getByText('태그 없음')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })
})

describe('TagInput: 태그 제거', () => {
  it('요구 4: 태그마다 제거 버튼이 하나씩 있고, 그 태그를 가리키는 접근 가능한 이름을 갖는다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await addTag(user, 'react')
    await addTag(user, 'vite')

    expect(within(itemFor('react')).getByRole('button', { name: /react/ })).toBeTruthy()
    expect(within(itemFor('vite')).getByRole('button', { name: /vite/ })).toBeTruthy()
  })

  it('요구 4: 제거 버튼을 누르면 그 태그만 DOM에서 사라진다(숨김이 아니라 언렌더)', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await addTag(user, 'react')
    await addTag(user, 'vite')
    await addTag(user, 'vitest')

    await user.click(within(itemFor('vite')).getByRole('button'))

    // queryByText는 CSS로 숨긴 요소도 찾아낸다. null이라는 것은 실제로 언렌더됐다는 뜻이다.
    expect(screen.queryByText('vite')).toBeNull()
    expect(screen.getByText('react')).toBeTruthy()
    expect(screen.getByText('vitest')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('제거한 태그는 다시 추가할 수 있다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await addTag(user, 'react')
    await user.click(within(itemFor('react')).getByRole('button'))
    await addTag(user, 'react')

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('react')).toBeTruthy()
  })
})
