import type { ICurrencyService } from '../interfaces/ICurrencyService';
import { STARTING_CURRENCY } from '../../config/constants';

/** 로컬 mock 화폐 서비스 */
export class MockCurrencyService implements ICurrencyService {
  private balances: Map<string, number> = new Map();

  async getBalance(userId: string): Promise<number> {
    if (!this.balances.has(userId)) {
      this.balances.set(userId, STARTING_CURRENCY);
    }
    return this.balances.get(userId)!;
  }

  async spend(userId: string, amount: number, _reason: string): Promise<boolean> {
    const balance = await this.getBalance(userId);
    if (balance < amount) return false;
    this.balances.set(userId, balance - amount);
    return true;
  }

  async earn(userId: string, amount: number, _reason: string): Promise<number> {
    const balance = await this.getBalance(userId);
    const newBalance = balance + amount;
    this.balances.set(userId, newBalance);
    return newBalance;
  }
}
