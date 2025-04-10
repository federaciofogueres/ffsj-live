export interface IRealTimeConfigModel {
    event?: IRealTimeEvent;
    list?: IRealTimeList;
    live?: IRealTimeLive;
    streaming?: IRealTimeStreaming;
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
    items: IRealTimeItem[];
    searching: string;
    filterKeys: string[];
}

export interface IRealTimeItem {
    id: string;
    informacionPersonal: {
        dni: string;
        nombre: string;
        fechaNacimiento: string;
        ciudad: string;
        email: string;
        telefono: string;
        edad: string;
        tipoCandidata: string;
    };
    vidaEnFogueres: {
        asociacion_order?: number;
        asociacion_label?: string;
        asociacion: string;
        anyosFiesta: number;
        curriculum: string;
    };
    academico: {
        formacion: string;
        situacionLaboral?: string;
        observaciones?: string;
        aficiones?: string;
    };
    documentacion: {
        autorizacionFoguera: string;
        compromisoDisponibilidad: string;
        derechosAutor: string;
        dniEscaneado: string;
        fotoBelleza: string;
        fotoCalle: string;
    };
    responsables: {
        nombreTutor1?: string;
        nombreTutor2?: string;
        telefonoTutor1?: string;
        telefonoTutor2?: string;
    };
}

// Live info
export interface IRealTimeLive {
    descripcion: string;
    item: IRealTimeItem;
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

export function createDefaultLiveInfo(): IRealTimeLive {
    return {
        descripcion: '',
        item: {
            id: '',
            informacionPersonal: {
                dni: '',
                nombre: '',
                fechaNacimiento: '',
                ciudad: '',
                email: '',
                telefono: '',
                edad: '',
                tipoCandidata: ''
            },
            vidaEnFogueres: {
                asociacion_order: undefined,
                asociacion_label: undefined,
                asociacion: '',
                anyosFiesta: 0,
                curriculum: ''
            },
            academico: {
                formacion: '',
                situacionLaboral: undefined,
                observaciones: undefined,
                aficiones: undefined
            },
            documentacion: {
                autorizacionFoguera: '',
                compromisoDisponibilidad: '',
                derechosAutor: '',
                dniEscaneado: '',
                fotoBelleza: '',
                fotoCalle: ''
            },
            responsables: {
                nombreTutor1: undefined,
                nombreTutor2: undefined,
                telefonoTutor1: undefined,
                telefonoTutor2: undefined
            }
        },
        tipo: '',
        titulo: ''
    };
}