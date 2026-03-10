import { Metadata } from 'next'
import { BookingPage } from '@/components/marketing/booking-page'

export const metadata: Metadata = {
  title: 'Book a Free Consultation — AI Marketing Commander',
  description:
    'Schedule a free 30-minute call to see how AI Marketing Commander can transform your agency.',
}

export default function BookPage() {
  return <BookingPage />
}