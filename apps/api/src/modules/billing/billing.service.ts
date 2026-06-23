import { Injectable } from '@nestjs/common'

@Injectable()
export class BillingService {
  getPlans() {
    return [
      { id: 'free', name: 'Gratuito', price: 0, limits: { contacts: 50, messagesPerMonth: 500 } },
      { id: 'starter', name: 'Starter', price: 97, limits: { contacts: 500, messagesPerMonth: 5000 } },
      { id: 'pro', name: 'Pro', price: 197, limits: { contacts: 5000, messagesPerMonth: 50000 } },
      { id: 'enterprise', name: 'Enterprise', price: 497, limits: { contacts: -1, messagesPerMonth: -1 } },
    ]
  }
}
