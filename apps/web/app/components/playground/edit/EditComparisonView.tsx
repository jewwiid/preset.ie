'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Download, 
  Save, 
  RotateCcw, 
  Loader2, 
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react'

interface EditComparisonViewProps {
  sourceImage: string | null
  resultImage: string | null
  loading: boolean
  onSaveResult: (imageUrl: string) => void
  onDownloadResult: (imageUrl: string) => void
  onTryAnotherEdit: () => void
  onUseResultAsSource: () => void
  savingImage?: string | null
}

export default function EditComparisonView({
  sourceImage,
  resultImage,
  loading,
  onSaveResult,
  onDownloadResult,
  onTryAnotherEdit,
  onUseResultAsSource,
  savingImage
}: EditComparisonViewProps) {
  const [showBefore, setShowBefore] = useState(true)
  const [showAfter, setShowAfter] = useState(true)

  const hasResult = resultImage && !loading
  const isSaving = savingImage === resultImage

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Edit Comparison</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBefore(!showBefore)}
              className="flex items-center gap-1"
            >
              {showBefore ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Before
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAfter(!showAfter)}
              className="flex items-center gap-1"
            >
              {showAfter ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              After
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Before/After Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Before Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Before</h3>
              <Badge variant="outline">Original</Badge>
            </div>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {sourceImage ? (
                <img
                  src={sourceImage}
                  alt="Original image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No source image</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* After Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">After</h3>
              {hasResult ? (
                <Badge variant="default">Edited</Badge>
              ) : loading ? (
                <Badge variant="secondary">Processing...</Badge>
              ) : (
                <Badge variant="outline">No result</Badge>
              )}
            </div>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-muted-foreground">Applying edit...</p>
                  </div>
                </div>
              ) : hasResult ? (
                <img
                  src={resultImage}
                  alt="Edited image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Apply an edit to see result</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {hasResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onSaveResult(resultImage)}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Result
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onDownloadResult(resultImage)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onTryAnotherEdit}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Another Edit
              </Button>
              <Button
                variant="secondary"
                onClick={onUseResultAsSource}
                className="flex-1"
              >
                Use as New Source
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!hasResult && !loading && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground text-center">
              Select an image and apply an edit to see the before/after comparison
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
