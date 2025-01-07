/**
 * 🔌 Circuit Breaker: Your Safety Switch!
 *
 * Protects your system from repeated failures.
 * Like having a friendly electrician that prevents overload! ⚡
 *
 * Features:
 * - 🛡️ Failure counting
 * - ⏲️ Automatic reset
 * - 🚦 Status tracking
 * - 🔄 Self-healing
 *
 * @class CircuitBreaker
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailure: number = 0;
  private readonly threshold: number = 5;
  private readonly resetTimeout: number = 30000; // 30 seconds

  /**
   * 🔍 Check Circuit Status
   *
   * Sees if the circuit is open (stopping requests).
   * Like checking if the safety switch is off! 🔴
   *
   * @returns {boolean} true if circuit is open (stopping requests)
   */
  isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const now = Date.now();
      if (now - this.lastFailure >= this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * ❌ Record an Error
   *
   * Notes when something goes wrong.
   * Like keeping track of power surges! ⚡
   */
  onError(): void {
    this.failures++;
    this.lastFailure = Date.now();
  }

  /**
   * ✅ Record a Success
   *
   * Notes when something works right.
   * Like confirming the power is stable! 💡
   */
  onSuccess(): void {
    this.reset();
  }

  /**
   * 🔄 Reset the Circuit
   *
   * Clears the failure count and timer.
   * Like flipping the safety switch back on! 🟢
   *
   * @private
   */
  private reset(): void {
    this.failures = 0;
    this.lastFailure = 0;
  }
}
