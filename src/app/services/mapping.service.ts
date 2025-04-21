import { Injectable } from '@angular/core';
import { IRealTimeItem } from '../model/real-time-config.model';

@Injectable({
    providedIn: 'root'
})
export class MappingService {
    mapToIRealTimeItem(item: any, index: number): IRealTimeItem {
        return {
            id: item.id || (index + 1).toString(),
            informacionPersonal: {
                dni: item.dni || '',
                nombre: item.nombre || '',
                fechaNacimiento: item.fechaNacimiento || '',
                ciudad: item.ciudad || '',
                email: item.email || '',
                telefono: item.telefono || '',
                edad: item.edad || '',
                tipoCandidata: item.tipoCandidata || ''
            },
            vidaEnFogueres: {
                asociacion_order: item.asociacion_order || undefined,
                asociacion_label: item.asociacion_label || '',
                asociacion: item.asociacion || '',
                anyosFiesta: item.anyosFiesta || 0,
                curriculum: item.curriculum || ''
            },
            academico: {
                formacion: item.formacion || '',
                situacionLaboral: item.situacionLaboral || '',
                observaciones: item.observaciones || '',
                aficiones: item.aficiones || ''
            },
            documentacion: {
                autorizacionFoguera: item.autorizacionFoguera || '',
                compromisoDisponibilidad: item.compromisoDisponibilidad || '',
                derechosAutor: item.derechosAutor || '',
                dniEscaneado: item.dniEscaneado || '',
                fotoBelleza: item.fotoBelleza || '',
                fotoCalle: item.fotoCalle || ''
            },
            responsables: {
                nombreTutor1: item.nombreTutor1 || '',
                nombreTutor2: item.nombreTutor2 || '',
                telefonoTutor1: item.telefonoTutor1 || '',
                telefonoTutor2: item.telefonoTutor2 || ''
            }
        };
    }

    mapItemToExcelRow(item: IRealTimeItem): any {
        return {
            id: item.id,
            dni: item.informacionPersonal?.dni || '',
            nombre: item.informacionPersonal?.nombre || '',
            fechaNacimiento: item.informacionPersonal?.fechaNacimiento || '',
            ciudad: item.informacionPersonal?.ciudad || '',
            email: item.informacionPersonal?.email || '',
            telefono: item.informacionPersonal?.telefono || '',
            edad: item.informacionPersonal?.edad || '',
            tipoCandidata: item.informacionPersonal?.tipoCandidata || '',
            asociacion_order: item.vidaEnFogueres?.asociacion_order || '',
            asociacion_label: item.vidaEnFogueres?.asociacion_label || '',
            asociacion: item.vidaEnFogueres?.asociacion || '',
            anyosFiesta: item.vidaEnFogueres?.anyosFiesta || '',
            curriculum: item.vidaEnFogueres?.curriculum || '',
            formacion: item.academico?.formacion || '',
            situacionLaboral: item.academico?.situacionLaboral || '',
            observaciones: item.academico?.observaciones || '',
            aficiones: item.academico?.aficiones || '',
            autorizacionFoguera: item.documentacion?.autorizacionFoguera || '',
            compromisoDisponibilidad: item.documentacion?.compromisoDisponibilidad || '',
            derechosAutor: item.documentacion?.derechosAutor || '',
            dniEscaneado: item.documentacion?.dniEscaneado || '',
            fotoBelleza: item.documentacion?.fotoBelleza || '',
            fotoCalle: item.documentacion?.fotoCalle || '',
            nombreTutor1: item.responsables?.nombreTutor1 || '',
            nombreTutor2: item.responsables?.nombreTutor2 || '',
            telefonoTutor1: item.responsables?.telefonoTutor1 || '',
            telefonoTutor2: item.responsables?.telefonoTutor2 || ''
        };
    }
}