'use client'

import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Eye, ImageIcon, X } from 'lucide-react'
import Image from 'next/image'

export interface PresetVisualAidProps {
  imageUrl: string
  altText: string
  description: string
  parameterType: string
  parameterValue: string
}

export function PresetVisualAid({
  imageUrl,
  altText,
  description,
  parameterType,
  parameterValue
}: PresetVisualAidProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={() => setIsModalOpen(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {parameterType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {parameterValue}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <PresetVisualAidModal
          imageUrl={imageUrl}
          altText={altText}
          description={description}
          parameterType={parameterType}
          parameterValue={parameterValue}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

export interface PresetVisualAidGridProps {
  visualAids: Array<{
    id: string
    image_url: string
    alt_text: string
    description: string
    parameter_type: string
    parameter_value: string
  }>
  parameterType?: string
}

export function PresetVisualAidGrid({ visualAids, parameterType }: PresetVisualAidGridProps) {
  const filteredAids = parameterType 
    ? visualAids.filter(aid => aid.parameter_type === parameterType)
    : visualAids

  if (filteredAids.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No visual aids available for {parameterType || 'this parameter type'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredAids.map((aid) => (
        <PresetVisualAid
          key={aid.id}
          imageUrl={aid.image_url}
          altText={aid.alt_text}
          description={aid.description}
          parameterType={aid.parameter_type}
          parameterValue={aid.parameter_value}
        />
      ))}
    </div>
  )
}

export interface PresetVisualAidModalProps {
  imageUrl: string
  altText: string
  description: string
  parameterType: string
  parameterValue: string
  onClose: () => void
}

export function PresetVisualAidModal({
  imageUrl,
  altText,
  description,
  parameterType,
  parameterValue,
  onClose
}: PresetVisualAidModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{parameterType}</Badge>
            <Badge variant="outline">{parameterValue}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="relative aspect-video w-full max-w-3xl mx-auto mb-4">
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className="object-contain"
            />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium mb-2">{altText}</p>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}