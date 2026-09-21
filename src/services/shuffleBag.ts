export class ShuffleBag<T> {
  private original: T[];
  private current: T[];
  private last: T | null = null;

  constructor(items: T[]) {
    this.original = [...items];
    this.current = [...items];
  }

  next(): T {
    if (this.current.length === 0) {
      this.current = [...this.original];
      // Prevent immediate repeat on refill boundary
      if (this.current.length > 1 && this.last !== null) {
        this.current = this.current.filter((i) => i !== this.last);
      }
    }
    const idx = Math.floor(Math.random() * this.current.length);
    const picked = this.current.splice(idx, 1)[0];
    this.last = picked;
    return picked;
  }
}
