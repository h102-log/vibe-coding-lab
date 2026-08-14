/**
 * App — TagInput을 렌더하는지 지키는 테스트.
 *
 * 이 저장소에는 SPEC.md가 없다. 아래 요구는 구현 의뢰문에 적힌 문장을 그대로 옮긴 것이다.
 *
 * 요구: "src/TagInput.tsx 에 태그 입력 컴포넌트 TagInput을 구현하고, src/App.tsx 가 그것을 렌더하게 한다."
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('TagInput을 렌더한다: 입력창과 빈 목록 표시가 보이고, Enter로 태그가 추가된다', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('태그 없음')).toBeTruthy()

    await user.type(screen.getByRole('textbox'), 'react{Enter}')

    expect(screen.getByRole('listitem').textContent).toContain('react')
  })
})
