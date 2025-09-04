import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, Calendar } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/compose" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message Now
          </Button>
        </Link>
        <Link href="/compose?schedule=true" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Clock className="w-4 h-4 mr-2" />
            Schedule Message
          </Button>
        </Link>
        <Link href="/scheduled" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Calendar className="w-4 h-4 mr-2" />
            View Scheduled
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
