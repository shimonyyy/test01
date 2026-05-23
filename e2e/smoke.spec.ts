import { test, expect } from '@playwright/test'

// 로그인되지 않은 사용자가 보호 페이지에 접근하면 /login 으로 리다이렉트되는지 확인.
// VITE_SUPABASE_URL 이 설정되지 않은 경우 클라이언트는 경고만 출력하고 동작은 유지된다.
test('비로그인 시 /login 으로 리다이렉트', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'BERTI 재고관리' })).toBeVisible()
})

test('회원가입 페이지로 이동', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: '회원가입' }).click()
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible()
})

test('회원가입 폼 검증', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: '가입하기' }).click()
  await expect(page.getByText('이메일 형식이 올바르지 않습니다.')).toBeVisible()
})
