import { PageSkeleton } from '@/components/PageSkeleton'

// blog/layout.tsx already renders the Navbar for this segment.
export default function Loading() {
  return <PageSkeleton withNavbar={false} />
}
