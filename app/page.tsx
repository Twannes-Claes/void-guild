import { HomeClient } from './HomeClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const HomeSkeleton = (
    <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] 2xl:grid-cols-[440px_1fr] gap-8 opacity-40 grayscale pointer-events-none select-none items-start">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <HomeClient skeleton={HomeSkeleton} />
    </main>
  )
}
