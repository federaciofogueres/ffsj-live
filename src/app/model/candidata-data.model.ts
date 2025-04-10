export interface InformacionPersonal {
  dni: string;
  nombre: string;
  fechaNacimiento: string;
  ciudad: string;
  email: string;
  telefono: string;
  edad: string;
  tipoCandidata: string;
}

export interface VidaEnFogueres {
  asociacion_label: string;
  asociacion_order: string;
  asociacion: string;
  anyosFiesta: string;
  curriculum: string;
}

export interface Academico {
  formacion: string;
  situacionLaboral: string;
  observaciones: string;
  aficiones: string;
}

export interface Documentacion {
  autorizacionFoguera: string;
  compromisoDisponibilidad: string;
  derechosAutor: string;
  dniEscaneado: string;
  fotoBelleza: string;
  fotoCalle: string;
}

export interface Responsables {
  nombreTutor1: string;
  nombreTutor2: string;
  telefonoTutor1: string;
  telefonoTutor2: string;
}

export interface CandidataData {
  id: string;
  informacionPersonal: InformacionPersonal;
  vidaEnFogueres: VidaEnFogueres;
  academico: Academico;
  documentacion: Documentacion;
  responsables: Responsables;
}

export type TiposCampos = InformacionPersonal | VidaEnFogueres | Academico | Documentacion | Responsables;

export const LabelsFormulario: { [key in string]: string } = {
  ['id']: 'ID',
  ['dni']: 'DNI',
  ['nombre']: 'Nombre',
  ['fechaNacimiento']: 'Fecha de nacimiento',
  ['ciudad']: 'Ciudad',
  ['email']: 'Email',
  ['telefono']: 'Teléfono',
  ['edad']: 'Edad',
  ['tipoCandidata']: 'Tipo de candidata',
  ['asociacion']: 'Asociación',
  ['anyosFiesta']: 'Años en la fiesta',
  ['curriculum']: 'Currículum',
  ['formacion']: 'Formación',
  ['situacionLaboral']: 'Situación laboral',
  ['observaciones']: 'Observaciones',
  ['aficiones']: 'Aficiones',
  ['autorizacionFoguera']: 'Autorización Foguera',
  ['compromisoDisponibilidad']: 'Compromiso de disponibilidad',
  ['derechosAutor']: 'Derechos de autor',
  ['dniEscaneado']: 'DNI escaneado',
  ['fotoBelleza']: 'Foto belleza',
  ['fotoCalle']: 'Foto calle',
  ['nombreTutor1']: 'Nombre del tutor 1',
  ['nombreTutor2']: 'Nombre del tutor 2',
  ['telefonoTutor1']: 'Teléfono del tutor 1',
  ['telefonoTutor2']: 'Teléfono del tutor 2',
  ['informacionPersonal']: 'Información personal',
  ['vidaEnFogueres']: 'Vida en Fogueres',
  ['academico']: 'Información académica',
  ['documentacion']: 'Documentación',
  ['responsables']: 'Responsables'
};

export interface InfoShowTable {
  id: string;
  foguera: string;
  informacionPersonal: string;
  vidaEnFogueres: string;
  academico: string;
  documentacion: string;
  responsables?: string;
}