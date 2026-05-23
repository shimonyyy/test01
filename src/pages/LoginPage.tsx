import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.')
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword(values)
    setSubmitting(false)
    if (error) {
      toast.error('로그인 실패', { description: error.message })
      return
    }
    toast.success('환영합니다.')
    navigate('/', { replace: true })
  }

  async function onMagicLink() {
    const email = (document.getElementById('email') as HTMLInputElement)?.value
    if (!email) return toast.error('이메일을 입력해 주세요.')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) return toast.error('전송 실패', { description: error.message })
    toast.success('매직링크를 보냈습니다. 메일을 확인해 주세요.')
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 safe-top">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold">BERTI 재고관리</h1>
          <p className="text-sm text-slate-500 mt-1">현장에서 빠르게 입력하세요.</p>
        </header>

        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            className="field"
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </button>
        <button type="button" className="btn-secondary w-full" onClick={onMagicLink}>
          매직링크로 로그인
        </button>

        <p className="text-center text-sm text-slate-500">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-brand-900 font-semibold">회원가입</Link>
        </p>
      </form>
    </div>
  )
}
