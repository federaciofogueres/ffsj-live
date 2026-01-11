export interface Candidatura {
    type?: 'simple' | 'multiple' | 'jurado';
    label?: string;
    votes: number;
    maxVotes: number;
    fields?: CandidaturaField[];
    jurado?: CandidaturaJurado;
}

export interface CandidaturaField {
    key: string;
    value: string | number;
    inputType: 'text' | 'number' | 'image';
}

export interface CandidaturaJurado {
    nombre: string;
    foguera: string;
    imagen?: string;
}
