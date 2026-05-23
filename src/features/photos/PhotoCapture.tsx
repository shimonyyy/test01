import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

// 카메라로 촬영하거나 갤러리에서 선택 → Supabase Storage 업로드 → URL 반환.
// 경로: <user_id>/<client_uuid>/<timestamp>.jpg

export default function PhotoCapture({
  userId,
  clientUuid,
  value,
  onChange
}: {
  userId: string
  clientUuid: string
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${userId}/${clientUuid}/${Date.now()}.${ext}`
        const { error } = await supabase.storage
          .from('transaction-photos')
          .upload(path, file, { contentType: file.type, upsert: false })
        if (error) throw error
        uploaded.push(path)
      }
      onChange([...value, ...uploaded])
      toast.success(`${uploaded.length}장 업로드 완료`)
    } catch (e: any) {
      toast.error('사진 업로드 실패', { description: e?.message })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function remove(path: string) {
    onChange(value.filter((p) => p !== path))
    supabase.storage.from('transaction-photos').remove([path]).catch(() => {})
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((path) => (
          <PhotoThumb key={path} path={path} onRemove={() => remove(path)} />
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 disabled:opacity-50"
        >
          {uploading ? '업로드…' : <Camera className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

function PhotoThumb({ path, onRemove }: { path: string; onRemove: () => void }) {
  const [url, setUrl] = useState<string>('')
  if (!url) {
    supabase.storage
      .from('transaction-photos')
      .createSignedUrl(path, 60 * 30)
      .then(({ data }) => data?.signedUrl && setUrl(data.signedUrl))
  }
  return (
    <div className="relative w-20 h-20">
      {url ? (
        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-slate-100" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
