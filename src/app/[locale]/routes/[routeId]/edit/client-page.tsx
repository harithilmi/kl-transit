'use client'

import { Card } from '@/app/components/ui/card'
import type { Route } from '@/types/routes'
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useState } from 'react'
import { RouteTypes } from '@/types/routes'
import { useRouter } from 'next/navigation'
import { HexColorPicker } from 'react-colorful'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { cn } from '@/lib/utils'

interface ClientPageProps {
  routeData: Route
}

export default function ClientPage({ routeData }: ClientPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [routeColor, setRouteColor] = useState(routeData.routeColor)
  const [routeTextColor, setRouteTextColor] = useState(routeData.routeTextColor)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const updatedRoute = {
      ...routeData,
      routeShortName: formData.get('routeShortName') as string,
      routeLongName: formData.get('routeLongName') as string,
      operatorId: formData.get('operatorId') as string,
      networkId: formData.get('networkId') as string,
      routeType: Number(formData.get('routeType')),
      routeColor,
      routeTextColor,
    }

    try {
      const response = await fetch(`/api/routes/${routeData.routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRoute),
      })

      if (!response.ok) throw new Error('Failed to update route')

      router.refresh()
    } catch (error) {
      console.error('Error updating route:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">
        {t('RouteEdit.title', { routeId: routeData.routeShortName })}
      </h1>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('RouteEdit.details.title')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeShortName">
                {t('RouteEdit.details.shortName')}
              </Label>
              <Input
                id="routeShortName"
                name="routeShortName"
                defaultValue={routeData.routeShortName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeLongName">
                {t('RouteEdit.details.longName')}
              </Label>
              <Input
                id="routeLongName"
                name="routeLongName"
                defaultValue={routeData.routeLongName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatorId">
                {t('RouteEdit.details.operator')}
              </Label>
              <Input
                id="operatorId"
                name="operatorId"
                defaultValue={routeData.operatorId}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="networkId">
                {t('RouteEdit.details.network')}
              </Label>
              <Input
                id="networkId"
                name="networkId"
                defaultValue={routeData.networkId}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routeType">{t('RouteEdit.details.type')}</Label>
              <Select
                name="routeType"
                defaultValue={String(routeData.routeType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RouteTypes).map(([key, value], index) => (
                    <SelectItem key={key} value={String(index)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('RouteEdit.details.colors')}</Label>
              <div className="flex gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-[100px] h-[35px]')}
                      style={{ backgroundColor: routeColor }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker
                      color={routeColor}
                      onChange={setRouteColor}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-[100px] h-[35px]')}
                      style={{ backgroundColor: routeTextColor }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker
                      color={routeTextColor}
                      onChange={setRouteTextColor}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('Common.saving') : t('Common.save')}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
