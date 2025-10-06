import { initializeScheduler } from '../utils/scheduler'

export default async () => {
  // Initialize the scheduler when the server starts
  if (process.env.NODE_ENV !== 'test') {
    initializeScheduler()
  }
}
