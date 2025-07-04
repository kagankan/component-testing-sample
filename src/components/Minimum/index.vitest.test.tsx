import { describe, expect, it } from "vitest"
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Sample } from "."

/**
 * @vitest-environment jsdom
 */
describe("Sample", () => {
  it("should render", () => {
    render(<Sample />)

    expect(screen.getByText("サンプルテキスト")).toBeVisible()
  })
})