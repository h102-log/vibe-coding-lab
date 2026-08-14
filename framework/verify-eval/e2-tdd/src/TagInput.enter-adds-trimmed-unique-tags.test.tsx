/**
 * TagInput — 태그 추가 규칙을 지키는 테스트.
 *
 * 이 저장소에는 SPEC.md가 없다. 아래 요구는 구현 의뢰문에 적힌 문장을 그대로 옮긴 것이다.
 *
 * 요구 2: "입력창에서 Enter를 누르면 입력값이 태그로 추가되고 입력창은 비워진다.
 *          태그는 앞뒤 공백을 제거해 저장하고, 공백 제거 후 빈 문자열이면 추가하지 않는다."
 * 요구 3: "이미 있는 태그와 같은 값이면(공백 제거 후 비교) 다시 추가하지 않는다."
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagInput from './TagInput'

afterEach(cleanup)

function tagTexts() {
  return screen.queryAllByRole('listitem').map((li) => li.textContent)
}

describe('TagInput: Enter로 태그 추가', () => {
  it('요구 2: Enter를 누르면 입력값이 태그로 추가되고 입력창이 비워진다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'react{Enter}')

    expect(screen.getByText('react')).toBeTruthy()
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('요구 2: 태그는 앞뒤 공백을 제거해 저장한다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    await user.type(screen.getByRole('textbox'), '   typescript   {Enter}')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toContain('typescript')
    expect(items[0].textContent).not.toContain('   typescript')
  })

  it('요구 2: 공백 제거 후 빈 문자열이면 추가하지 않는다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '{Enter}')
    await user.type(input, '     {Enter}')

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('요구 3: 이미 있는 태그와 같은 값이면 다시 추가하지 않는다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'react{Enter}')
    await user.type(input, 'react{Enter}')

    expect(tagTexts()).toHaveLength(1)
  })

  it('요구 3: 중복 판정은 공백을 제거한 값으로 한다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'react{Enter}')
    await user.type(input, '  react  {Enter}')

    expect(tagTexts()).toHaveLength(1)
  })

  it('서로 다른 태그는 여러 개 쌓인다', async () => {
    const user = userEvent.setup()
    render(<TagInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'react{Enter}')
    await user.type(input, 'vite{Enter}')
    await user.type(input, 'vitest{Enter}')

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
