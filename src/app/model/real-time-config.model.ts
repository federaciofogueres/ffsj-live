export interface IRealTimeConfigModel {
    event: IRealTimeEvent;
    list: IRealTimeList;
    live: IRealTimeLive;
    streaming: IRealTimeStreaming;
}

// Eventos
export interface IRealTimeEvent {
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

// Listados
export interface IRealTimeList {
    title: string;
    items: IRealTimeItemsList[];
}

export interface IRealTimeItemsList {
    title: string;
    items: string;
}

// Live info
export interface IRealTimeLive {
    descripcion: string;
    item: string;
    tipo: string;
    titulo: string;
}

// Streaming info
export interface IRealTimeStreaming {
    src: string;
    title: string;
    subtitle: string;
    width: number;
    height: number;
}
