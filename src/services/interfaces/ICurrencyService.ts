/** 화폐 서비스 인터페이스 */
export interface ICurrencyService {
  /** 잔액 조회 */
  getBalance(userId: string): Promise<number>;

  /** 화폐 차감 (뽑기, 구매 등) */
  spend(userId: string, amount: number, reason: string): Promise<boolean>;

  /** 화폐 추가 (보상, 일일 지급 등) */
  earn(userId: string, amount: number, reason: string): Promise<number>;
}
