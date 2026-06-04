export type ReminderJobName = 'scheduler-tick' | 'dispatch-reminder'

export interface DispatchReminderJobData {
  reminderId: string
}
