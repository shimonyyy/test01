import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  name: z.string().min(1, '이름을 입력해 주세요.'),
  department: z.string().optional(),
  phone: z.string().optional()
})
type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          department: values.department ?? '',
          phone: values.phone ?? ''
        }
      }
    })
    setSubmitting(false)
    if (error) {
      toast.error('가입 실패', { description: error.message })
      return
    }
    toast.success('가입 메일을 보냈습니다.', {
      description: '이메일 인증 후 로그인해 주세요.'
    })
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 safe-top">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
        <header className="text-center mb-4">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-slate-500 mt-1">관리자 승인 후 로그인 가능합니다.</p>
        </header>

        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" className="field" {...register('email')} />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">비밀번호 (8자 이상)</label>
          <input id="password" type="password" autoComplete="new-password" className="field" {...register('password')} />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="name">이름</label>
          <input id="name" className="field" autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="department">소속/부서 (선택)</label>
          <input id="department" className="field" {...register('department')} />
        </div>

        <div>
          <label className="label" htmlFor="phone">연락처 (선택)</label>
          <input id="phone" className="field" inputMode="tel" autoComplete="tel" {...register('phone')} />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? '가입 중…' : '가입하기'}
        </button>

        <p className="text-center text-sm text-slate-500">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-brand-900 font-semibold">로그인</Link>
        </p>
      </form>
    </div>
  )
}
