export class RangeSet {
    private readonly singles: Set<number>;
    private readonly ranges: Set<[number, number]>

    constructor(singles: Iterable<number>, ranges: Iterable<[number, number]>) {
        this.singles = new Set(singles);
        this.ranges = new Set(ranges);
    }

    addSingle(n: number) {
        this.singles.add(n);
    }

    addRange(start: number, end: number) {
        this.ranges.add([start, end]);
    }

    has(n: number) {
        if (this.singles.has(n)) {
            return true;
        }

        for (const [start, end] of this.ranges) {
            if (n >= start && n < end) {
                return true;
            }
        }

        return false;
    }
}