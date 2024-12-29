'use client'

import { Card } from '@/app/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
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
import { Link } from '@/i8n/routing'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

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

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm(t('RouteEdit.trips.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete trip')

      router.refresh()
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  return (
    <main className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">
        {t('RouteEdit.title', { routeId: routeData.routeShortName })}
      </h1>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">
            {t('RouteEdit.tabs.details')}
          </TabsTrigger>
          <TabsTrigger value="trips">{t('RouteEdit.tabs.trips')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
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
                  <Label htmlFor="routeType">
                    {t('RouteEdit.details.type')}
                  </Label>
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
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t('RouteEdit.trips.title')}
              </h2>
              <Button asChild>
                <Link href={`/routes/${routeData.routeId}/edit/trips/new`}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  {t('RouteEdit.trips.add')}
                </Link>
              </Button>
            </div>
            <div className="grid gap-4">
              {routeData.trips.map((trip) => (
                <Card key={trip.tripId} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {trip.direction === 0 ? (
                        <ArrowRight className="h-4 w-4" />
                      ) : (
                        <ArrowLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{trip.headsign}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('RouteEdit.trips.stopCount', {
                          count: trip.stopDetails.length,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/routes/${routeData.routeId}/edit/trips/${trip.tripId}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTrip(trip.tripId)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
