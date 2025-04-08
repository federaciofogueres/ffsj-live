export interface IRealTimeEventInfo {
    title: string;
    horario: string;
    presentadores: IRealTimePresentador[]
    eventos: string[]
}


export interface IRealTimePresentador {
    nombre: string;
    info: string;
    src: string;
}