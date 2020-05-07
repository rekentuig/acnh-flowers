/**
 * Represents an ACNH flower genetic sequence.
 */
export class Gene {
    private seq: Seq;

    private constructor(seq: Seq) {
        this.seq = seq;
    }

    /**
     * Produce a Gene from a gene string (e.g., 'RrYYwwss').
     * @param input The gene string
     * @returns The produced Gene object
     */
    public static fromString(input: string): Gene {
        return new Gene(parseGeneString(input));
    }

    /**
     * Textual representation of the Gene object.
     */
    public toString(): string {
        const gene_string = toGeneString(this.seq);
        return `Gene('${gene_string}')`;
    }

    /**
     * Produce the Genes and their probabilities for crossing two Genes.
     * @param other The other Gene to cross with
     * @returns Array of [Gene, probability] tuples
     */
    public cross(other: Gene): [Gene, number][] {
        const cartesian = combineCartesian(this.seq, other.seq);
        return reduceAndNormalize(cartesian).map(
            (kv: [Seq, number]): [Gene, number] => {
                return [new Gene(kv[0]), kv[1]];
            }
        );
    }
}

/**
 * A gene sequence is represented internally as an 8-bit number.
 * Each pair of bits represents one of four allele pairs: red, yellow,
 * white, and shade. A 1 represents a dominant allele, a 0 represents a
 * recessive allele. A normalized sequence may only consist of 00, 01, and
 * 11 bit pair values.
 */
type Seq = number;

/**
 * String representation for all-dominant-alleles.
 */
const SEQ_UPPER = 'RRYYWWSS';

/**
 * Parse a gene string (e.g., 'RrYYwwss') to produce a gene sequence.
 * @param gene_string The gene string
 * @returns The gene sequence
 */
function parseGeneString(gene_string: string): Seq {
    let seq: Seq = 0x00;
    for (let i = 0; i < 8; ++i) {
        seq |= Number(gene_string[i] === SEQ_UPPER[i]) << (7 - i);
    }
    return normalizeBitPairs(seq);
}

/**
 * Produce a gene string (e.g., 'RrYYwwss') for the gene sequence.
 * @param seq The gene sequence to convert
 * @returns The gene string
 */
function toGeneString(seq: Seq): string {
    const SEQ_LOWER: string = SEQ_UPPER.toLowerCase();
    let gene_string = '';
    for (let i = 0; i < 8; ++i) {
        gene_string += (seq & (0x80 >> i)) ? SEQ_UPPER[i] : SEQ_LOWER[i];
    }
    return gene_string;
}

/**
 * Switch every pair of bits (2n), (2n+1) in the sequence around.
 * @param seq The sequence to switch
 * @returns The switched sequence
 */
function switchBitPairs(seq: Seq): Seq {
    return ((seq & 0xaa) >> 1) | ((seq & 0x55) << 1);
}

/**
 * Normalize every pair of bits (2n), (2n+1) to 00, 01 or 11.
 * @param seq The sequence to normalize
 * @returns The normalized sequence
 */
function normalizeBitPairs(seq: Seq): Seq {
    const even: Seq = seq & 0xaa;
    const odd: Seq = seq & 0x55;
    return (even | (odd << 1)) | ((even >> 1) & odd);
}

/**
 * Produce every possible combination of the gene sequences.
 * Sequences may (and generally will) occur multiple times in accordance with
 * their likelihood.
 * Arguments are symmetrical but argument order will influence order of
 * results.
 * @param lhs_seq First gene
 * @param rhs_seq Second gene
 * @returns Array of produced sequences.
 */
function combineCartesian(lhs_seq: Seq, rhs_seq: Seq): Seq[] {
    const flipped_rhs_seq = switchBitPairs(rhs_seq);
    let combined: Seq[] = [];
    for (let mask = 0x00; mask <= 0xff; ++mask) {
        const r = (~mask & lhs_seq) | (mask & flipped_rhs_seq);
        combined.push(normalizeBitPairs(r));
    }
    return combined;
}

/**
 * Reduce an array of gene sequences to [sequence, proportion] tuples.
 * @param combined Array of gene sequences
 * @returns Array of [sequence, proportion] tuples
 */
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
