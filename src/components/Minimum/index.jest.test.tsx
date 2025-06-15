import { describe, expect, it } from "@jest/globals"
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Sample } from "."

/**
 * @jest-environment jsdom
 */
describe("Sample", () => {
  it("should render", () => {
    render(<Sample />)

    // @ts-expect-error - toBeVisible is not a valid matcher
    expect(screen.getByText("サンプルテキスト")).toBeVisible()
  })
})