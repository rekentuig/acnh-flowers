export class Gene {
    private seq: Seq;

    private constructor(seq: Seq) {
        this.seq = seq;
    }

    static fromString(input: string): Gene {
        return new Gene(parseGeneString(input));
    }

    public toString(): string {
        const gene_string = toGeneString(this.seq);
        return `Gene('${gene_string}')`;
    }

    public cross(other: Gene): [Gene, number][] {
        const cartesian = combineCartesian(this.seq, other.seq);
        return reduceAndNormalize(cartesian).map(
            (kv: [Seq, number]): [Gene, number] => {
                return [new Gene(kv[0]), kv[1]];
            }
        );
    }
}

// A gene sequence is represented internally as an 8-bit number.
type Seq = number;

function parseGeneString(gene_string: string): Seq {
    const upper: string = 'RRYYWWSS';
    let seq: Seq = 0x00;
    for (let i = 0; i < 8; ++i) {
        seq |= Number(gene_string[i] === upper[i]) << (7 - i);
    }
    return normalize(seq);
}

export
function toGeneString(seq: Seq): string {
    const upper: string = 'RRYYWWSS';
    const lower: string = upper.toLowerCase();
    let gene_string = '';
    for (let i = 0; i < 8; ++i) {
        gene_string += (seq & (0x80 >> i)) ? upper[i] : lower[i];
    }
    return gene_string;
}

function flip(seq: Seq): Seq {
    return ((seq & 0xaa) >> 1) | ((seq & 0x55) << 1);
}

function normalize(seq: Seq): Seq {
    const even: Seq = seq & 0xaa;
    const odd: Seq = seq & 0x55;
    return (even | (odd << 1)) | ((even >> 1) & odd);
}

function combineCartesian(lhs_seq: Seq, rhs_seq: Seq): Seq[] {
    const flipped_rhs_seq = flip(rhs_seq);
    let combined: Seq[] = [];
    for (let mask = 0x00; mask <= 0xff; ++mask) {
        const r = (~mask & lhs_seq) | (mask & flipped_rhs_seq);
        combined.push(normalize(r));
    }
    return combined;
}

function reduceAndNormalize(combined: Seq[]): [Seq, number][] {
    let counts: {[seq: number]: number} = {};
    for (let i = 0; i < combined.length; ++i) {
        const key: Seq = combined[i];
        counts[key] = counts[key] ? counts[key] + 1 : 1;
    }
    return Object.entries<number>(counts).map(
        (kv: [string, number]): [Seq, number] => {
            return [Number(kv[0]), kv[1]/combined.length];
        }
    );
}    
