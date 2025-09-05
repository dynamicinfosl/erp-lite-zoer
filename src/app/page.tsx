
import { redirect } from 'next/navigation';
import { ENABLE_AUTH } from '@/constants/auth';

export default function HomePage() {
  if (ENABLE_AUTH) {
    redirect('/dashboard');
  } else {
    redirect('/dashboard');
  }
}
