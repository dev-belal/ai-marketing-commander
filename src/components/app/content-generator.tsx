'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  LoaderIcon,
  SparklesIcon,
  CopyIcon,
  DownloadIcon,
  RefreshCwIcon,
  FileTextIcon,
  MapPinIcon,
  HelpCircleIcon,
  TagIcon,
  ClipboardListIcon,
  SearchIcon,
  InstagramIcon,
  GitBranchIcon,
  ImageIcon,
  MailIcon,
  NewspaperIcon,
  MailCheckIcon,
  MailOpenIcon,
  LinkedinIcon,
  TwitterIcon,
  CameraIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { CONTENT_TYPES, getContentTypesByCategory } from '@/lib/content/content-types'
import type { ContentCategory, ContentType, ContentTypeConfig } from '@/types/content'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  FileText: FileTextIcon,
  MapPin: MapPinIcon,
  HelpCircle: HelpCircleIcon,
  Tag: TagIcon,
  ClipboardList: ClipboardListIcon,
  Search: SearchIcon,
  Instagram: InstagramIcon,
  GitBranch: GitBranchIcon,
  RefreshCw: RefreshCwIcon,
  Image: ImageIcon,
  Mail: MailIcon,
  Newspaper: NewspaperIcon,
  MailCheck: MailCheckIcon,
  MailOpen: MailOpenIcon,
  Linkedin: LinkedinIcon,
  Twitter: TwitterIcon,
  Camera: CameraIcon,
}

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  seo: 'bg-green-500/10 text-green-700 dark:text-green-400',
  ads: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  email: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  social: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
}

const LOADING_MESSAGES = [
  'Analyzing brand context...',
  'Writing your content...',
  'Applying finishing touches...',
]

const AD_CREATIVE_LOADING_MESSAGES = [
  'Generating your ad creative with DALL-E 3...',
  'Creating the visual concept...',
  'Building your design brief...',
]

type Client = {
  id: string
  name: string
  website_url: string | null
}

type Mode = 'client' | 'standalone'

type GenerationResult = {
  id: string
  output: string
  wordCount: number
  contentType: string
  creativeImageUrl?: string
  creativeDesignBrief?: string
}

type ContentGeneratorProps = {
  clients: Client[]
}

function ContentGenerator({ clients }: ContentGeneratorProps) {
  const [mode, setMode] = useState<Mode>('client')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('seo')
  const [selectedType, setSelectedType] = useState<ContentTypeConfig | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const categoryTypes = getContentTypesByCategory(activeCategory)

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const msgs = selectedType?.hasImageGeneration ? AD_CREATIVE_LOADING_MESSAGES : LOADING_MESSAGES
    setLoadingMsgIndex(0)
    intervalRef.current = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % msgs.length)
    }, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isGenerating, selectedType?.hasImageGeneration])

  function handleSelectType(config: ContentTypeConfig) {
    setSelectedType(config)
    setResult(null)
    // Reset inputs
    const defaults: Record<string, string> = {}
    for (const input of config.inputs) {
      defaults[input.id] = input.type === 'select' && input.options?.[0] ? input.options[0] : ''
    }
    setInputs(defaults)
  }

  function handleInputChange(id: string, value: string) {
    setInputs((prev) => ({ ...prev, [id]: value }))
  }

  async function handleGenerate() {
    if (!selectedType) return

    if (mode === 'client' && !selectedClientId) {
      toast.error('Please select a client')
      return
    }

    // Validate required fields
    for (const input of selectedType.inputs) {
      if (input.required && !inputs[input.id]?.trim()) {
        toast.error(`${input.label} is required`)
        return
      }
    }

    setIsGenerating(true)
    setResult(null)

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: mode === 'client' ? selectedClientId : null,
          contentType: selectedType.id,
          category: selectedType.category,
          inputs,
        }),
      })

      const json = await res.json()

      if (!json.success) {
        toast.error(json.error ?? 'Generation failed')
        return
      }

      setResult(json.data)
      toast.success('Content generated!')
    } catch {
      toast.error('Network error')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result.output)
    toast.success('Copied to clipboard')
  }

  function handleCopyBrief() {
    if (!result?.creativeDesignBrief) return
    navigator.clipboard.writeText(result.creativeDesignBrief)
    toast.success('Design brief copied')
  }

  function handleDownloadTxt() {
    if (!result) return
    const blob = new Blob([result.output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.contentType}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleRegenerate() {
    setResult(null)
    handleGenerate()
  }

  const loadingMsgs = selectedType?.hasImageGeneration ? AD_CREATIVE_LOADING_MESSAGES : LOADING_MESSAGES

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* LEFT PANEL */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4 text-primary" />
              Generate Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-full border p-0.5">
              <button
                type="button"
                onClick={() => setMode('client')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For a Client
              </button>
              <button
                type="button"
                onClick={() => setMode('standalone')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'standalone'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standalone
              </button>
            </div>

            {mode === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="content-client">Client</Label>
                <select
                  id="content-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category tabs */}
            <div className="flex gap-1 rounded-lg border p-1">
              {(['seo', 'ads', 'email', 'social'] as ContentCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat)
                    setSelectedType(null)
                    setResult(null)
                  }}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Content type grid */}
            <div className="grid grid-cols-2 gap-2">
              {categoryTypes.map((config) => {
                const Icon = ICON_MAP[config.icon] ?? FileTextIcon
                const isSelected = selectedType?.id === config.id
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => handleSelectType(config)}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`mt-0.5 size-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{config.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{config.estimatedTime}</p>
                      </div>
                    </div>
                    {config.hasImageGeneration && (
                      <Badge variant="secondary" className="mt-1.5 text-[9px]">
                        Image + Brief
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Dynamic input form */}
            {selectedType && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">{selectedType.description}</p>
                {selectedType.inputs.map((input) => (
                  <div key={input.id} className="space-y-1.5">
                    <Label htmlFor={`input-${input.id}`} className="text-xs">
                      {input.label}
                      {input.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {input.type === 'text' && (
                      <Input
                        id={`input-${input.id}`}
                        value={inputs[input.id] ?? ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        placeholder={input.placeholder}
                        className="h-8 text-sm"
                      />
                    )}
                    {input.type === 'textarea' && (
                      <textarea
                        id={`input-${input.id}`}
                        value={inputs[input.id] ?? ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        placeholder={input.placeholder}
                        rows={3}
                        className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      />
                    )}
                    {input.type === 'select' && input.options && (
                      <select
                        id={`input-${input.id}`}
                        value={inputs[input.id] ?? ''}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        {input.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || (mode === 'client' && !selectedClientId)}
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            )}

            <p className="text-center text-[11px] text-muted-foreground">
              Powered by Claude AI
              {selectedType?.hasImageGeneration ? ' + DALL-E 3' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div>
        {/* Empty state */}
        {!isGenerating && !result && (
          <Card>
            <CardContent className="flex min-h-[400px] items-center justify-center py-12">
              <div className="space-y-2 text-center">
                <SparklesIcon className="mx-auto size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Select a content type to get started
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isGenerating && (
          <Card>
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12">
              <LoaderIcon className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                {loadingMsgs[loadingMsgIndex]}
              </p>
              <div className="w-full max-w-md space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated result */}
        {result && selectedType && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={CATEGORY_COLORS[selectedType.category]}>
                  {selectedType.category.toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{selectedType.label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {mode === 'client'
                    ? clients.find((c) => c.id === selectedClientId)?.name ?? 'Client'
                    : 'Standalone'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {result.wordCount} words
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {result.contentType === 'ad_creative' ? (
                <AdCreativeOutput result={result} onCopyBrief={handleCopyBrief} />
              ) : (
                <ContentOutput result={result} />
              )}

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                {result.contentType === 'ad_creative' ? (
                  <>
                    {result.creativeImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(result.creativeImageUrl, '_blank')}
                      >
                        <DownloadIcon className="size-3.5" />
                        Download Image
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCopyBrief}>
                      <CopyIcon className="size-3.5" />
                      Copy Brief
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <CopyIcon className="size-3.5" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
                      <DownloadIcon className="size-3.5" />
                      Download .txt
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCwIcon className="size-3.5" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ContentOutput({ result }: { result: GenerationResult }) {
  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="raw">Raw Text</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="mt-3">
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4"
          dangerouslySetInnerHTML={{ __html: formatOutput(result.output) }}
        />
      </TabsContent>
      <TabsContent value="raw" className="mt-3">
        <pre className="max-h-[500px] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed">
          {result.output}
        </pre>
      </TabsContent>
    </Tabs>
  )
}

function AdCreativeOutput({
  result,
  onCopyBrief,
}: {
  result: GenerationResult
  onCopyBrief: () => void
}) {
  if (!result.creativeImageUrl && !result.creativeDesignBrief) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircleIcon className="size-4 shrink-0" />
        <p>No creative data available.</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="image">
      <TabsList>
        <TabsTrigger value="image">Generated Image</TabsTrigger>
        <TabsTrigger value="brief">Design Brief</TabsTrigger>
      </TabsList>
      <TabsContent value="image" className="mt-3">
        {result.creativeImageUrl ? (
          <div className="overflow-hidden rounded-lg border">
            <img
              src={result.creativeImageUrl}
              alt="Generated ad creative"
              className="w-full object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No image generated.</p>
        )}
      </TabsContent>
      <TabsContent value="brief" className="mt-3">
        <pre className="max-h-[500px] overflow-auto rounded-lg border bg-muted/30 p-4 text-xs leading-relaxed">
          {result.creativeDesignBrief}
        </pre>
        <Button variant="ghost" size="sm" className="mt-2" onClick={onCopyBrief}>
          <CopyIcon className="size-3.5" />
          Copy Brief
        </Button>
      </TabsContent>
    </Tabs>
  )
}

function formatOutput(text: string): string {
  // If it already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text
  }
  // Convert markdown-like formatting to HTML
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hH])/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/---/g, '<hr/>')
}

export { ContentGenerator }
