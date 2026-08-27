/**
 * Backend Google Apps Script - Recibe leads del formulario inicial y solicitudes detalladas para bancos.
 * Genera y almacena automáticamente el PDF de la firma digital en Google Drive para la Ley 1581 de 2012.
 * 
 * Despliegue: Implementar > Nueva implementación > Tipo: Aplicación web
 *   - Ejecutar como: Yo (tu cuenta)
 *   - Quién tiene acceso: Cualquier usuario
 * Copia la URL generada en APPS_SCRIPT_URL del index.html y solicitud-detallada.html
 */

const SHEET_LEADS = "Leads"; // Hoja para formulario inicial
const SHEET_DETAILED = "SolicitudesDetalladas"; // Hoja para formulario bancario avanzado
const DRIVE_FOLDER_NAME = "Firmas_Creditos_Vehiculares"; // Carpeta en Google Drive donde se guardan los PDFs de las firmas

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fechaHoraLocal = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    if (data.tipoFormulario === "detallado") {
      // 1. Guardar PDF de la firma en Google Drive si viene el base64 de la firma
      let drivePdfUrl = "Firma no enviada";
      if (data.firmaBase64) {
        drivePdfUrl = saveSignaturePdfToDrive_(data, fechaHoraLocal);
      }

      // 2. Insertar fila en Google Sheets SolicitudesDetalladas
      const sheet = getOrCreateDetailedSheet_();
      sheet.appendRow([
        fechaHoraLocal,
        data.nombre || "",
        data.tipoDoc || "",
        data.numDoc || "",
        data.fechaExpDoc || "",
        data.lugarExpDoc || "",
        data.fechaNacimiento || "",
        data.estadoCivil || "",
        data.nivelEstudios || "",
        data.personasACargo || "",
        data.telefono || "",
        data.email || "",
        data.edad || "",
        data.direccionResidencia || "",
        data.ciudad || "",
        data.departamento || "",
        data.tipoVivienda || "",
        data.tiempoResidencia || "",
        data.valorViviendaCanon || "",
        data.tipoContrato || "",
        data.empresa || "",
        data.cargo || "",
        data.fechaVinculacion || "",
        data.antiguedad || "",
        data.telefonoEmpresa || "",
        data.direccionEmpresa || "",
        data.ingresos || "",
        data.otrosIngresos || "",
        data.conceptoOtrosIngresos || "",
        data.egresos || "",
        data.vehiculo || "",
        data.estadoVehiculo || "",
        data.marcaVehiculo || "",
        data.lineaVehiculo || "",
        data.modeloVehiculo || "",
        data.concesionario || "",
        data.monto || "",
        data.cuotaInicial || "",
        data.refFamNombre || "",
        data.refFamTel || "",
        data.refFamParentesco || "",
        data.refFamCiudad || "",
        data.refPerNombre || "",
        data.refPerTel || "",
        data.refPerRelacion || "",
        data.refPerCiudad || "",
        drivePdfUrl
      ]);
    } else {
      const sheet = getOrCreateLeadsSheet_();
      sheet.appendRow([
        fechaHoraLocal,
        data.nombre || "",
        data.tipoDoc || "",
        data.numDoc || "",
        data.telefono || "",
        data.email || "",
        data.edad || "",
        data.vehiculo || "",
        data.monto || "",
        data.ocupacion || "",
        data.ingresos || "",
        data.demuestraIngresos || "",
        data.obligaciones || "",
        data.pazYSalvo || ""
      ]);
    }

    return jsonResponse_({ result: "success" });
  } catch (err) {
    return jsonResponse_({ result: "error", message: err.message });
  }
}

/**
 * Genera el documento PDF de autorización con la firma digital y lo guarda en Google Drive.
 * Retorna la URL de descarga o visualización del archivo en Drive.
 */
function saveSignaturePdfToDrive_(data, fechaHoraLocal) {
  try {
    let folder;
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1c2e4a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #1c2e4a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; color: #1c2e4a; font-size: 18px; text-transform: uppercase; }
          .header h4 { margin: 5px 0 0; color: #374387; font-size: 13px; font-weight: 600; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          .info-table td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; }
          .info-table td.label { font-weight: bold; width: 35%; color: #1c2e4a; background: #f7f9fc; }
          .ley-box { border: 1px solid #d8dade; background: #fcfcfd; padding: 15px; border-radius: 4px; font-size: 12px; color: #444; margin-bottom: 25px; text-align: justify; }
          .sig-container { text-align: center; border: 2px dashed #1c2e4a; padding: 20px; background: #ffffff; border-radius: 6px; }
          .sig-img { max-width: 420px; max-height: 180px; width: auto; height: auto; }
          .footer { text-align: center; font-size: 10px; color: #777; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>AUTORIZACIÓN DE TRATAMIENTO DE DATOS Y CONSULTA DE RIESGO</h2>
          <h4>LEY ESTATUTARIA 1581 DE 2012 — COLOMBIA</h4>
        </div>

        <table class="info-table">
          <tr><td class="label">Nombre Completo:</td><td>${data.nombre || 'N/A'}</td></tr>
          <tr><td class="label">Documento de Identidad:</td><td>${data.tipoDoc || 'CC'} ${data.numDoc || 'N/A'}</td></tr>
          <tr><td class="label">Lugar / Fecha Expedición:</td><td>${data.lugarExpDoc || 'N/A'} — ${data.fechaExpDoc || 'N/A'}</td></tr>
          <tr><td class="label">Teléfono / WhatsApp:</td><td>${data.telefono || 'N/A'}</td></tr>
          <tr><td class="label">Correo Electrónico:</td><td>${data.email || 'N/A'}</td></tr>
          <tr><td class="label">Fecha y Hora de Firma:</td><td>${fechaHoraLocal}</td></tr>
        </table>

        <div class="ley-box">
          <b>DECLARACIÓN DE AUTORIZACIÓN:</b><br>
          De conformidad con lo dispuesto en la Ley Estatutaria 1581 de 2012 de Colombia y sus decretos reglamentarios, el suscrito titular declara que la información suministrada es veraz y autoriza de manera explícita, previa e informada el tratamiento de sus datos personales, así como la consulta, reporte y almacenamiento de su historial crediticio ante las centrales de riesgo (DataCrédito, CIFIN / TransUnion) para la gestión de su solicitud de crédito vehicular.
        </div>

        <div class="sig-container">
          <b style="font-size: 13px; color: #1c2e4a;">FIRMA DIGITAL REGISTRADA DEL TITULAR:</b><br><br>
          <img src="${data.firmaBase64}" class="sig-img" />
        </div>

        <div class="footer">
          Documento generado automáticamente como comprobante oficial de firma digital bajo la Ley 1581 de 2012.
        </div>
      </body>
      </html>
    `;

    const blob = Utilities.newBlob(htmlBody, 'text/html', `Firma_Ley1581_${data.numDoc || 'solicitud'}.html`).getAs('application/pdf');
    const fileName = `Firma_Ley1581_${data.numDoc || 'doc'}_${(data.nombre || '').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    const pdfFile = folder.createFile(blob);
    pdfFile.setName(fileName);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return pdfFile.getUrl();
  } catch (err) {
    return "Error generando PDF en Drive: " + err.message;
  }
}

// Manejo de solicitud GET: Búsqueda por número de documento o status
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.numDoc) {
      const targetDoc = String(e.parameter.numDoc).trim();
      const sheet = getOrCreateLeadsSheet_();
      const rows = sheet.getDataRange().getValues();

      // Buscar de la última fila hacia arriba (lead más reciente)
      for (let i = rows.length - 1; i >= 1; i--) {
        const rowDoc = String(rows[i][3]).trim();
        if (rowDoc === targetDoc) {
          return jsonResponse_({
            result: "found",
            lead: {
              fecha: rows[i][0],
              nombre: rows[i][1],
              tipoDoc: rows[i][2],
              numDoc: rows[i][3],
              telefono: rows[i][4],
              email: rows[i][5],
              edad: rows[i][6],
              vehiculo: rows[i][7],
              monto: rows[i][8],
              ocupacion: rows[i][9],
              ingresos: rows[i][10],
              demuestraIngresos: rows[i][11],
              obligaciones: rows[i][12],
              pazYSalvo: rows[i][13]
            }
          });
        }
      }
      return jsonResponse_({ result: "not_found", message: "No se encontraron datos previos para el documento ingresado." });
    }
    return jsonResponse_({ status: "API activa" });
  } catch (err) {
    return jsonResponse_({ result: "error", message: err.message });
  }
}

// Crea la hoja "Leads" con encabezados si no existe
function getOrCreateLeadsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LEADS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LEADS);
    sheet.appendRow([
      "Fecha/Hora", "Nombre", "Tipo Doc", "Número Doc", "Teléfono",
      "Email", "Edad", "Vehículo", "Monto Financiar", "Ocupación", "Ingresos Mensuales",
      "Demuestra Ingresos", "Obligaciones Financieras", "Paz y Salvo"
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Crea la hoja "SolicitudesDetalladas" con encabezados si no existe
function getOrCreateDetailedSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DETAILED);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DETAILED);
    sheet.appendRow([
      "Fecha/Hora", "Nombre Completo", "Tipo Doc", "Número Doc", "Fecha Exp Doc",
      "Lugar Exp Doc", "Fecha Nacimiento", "Estado Civil", "Nivel Estudios", "Personas A Cargo",
      "Teléfono", "Email", "Edad", "Dirección Residencia", "Ciudad", "Departamento",
      "Tipo Vivienda", "Tiempo Residencia", "Canon/Hipoteca", "Tipo Contrato", "Empresa/Negocio",
      "Cargo/Actividad", "Fecha Vinculación", "Antigüedad Laboral", "Teléfono Empresa", "Dirección Empresa",
      "Ingreso Básico", "Otros Ingresos", "Concepto Otros Ingresos", "Egresos Mensuales",
      "Tipo Vehículo", "Estado Vehículo", "Marca", "Línea/Modelo", "Año Modelo",
      "Concesionario", "Valor Vehículo", "Cuota Inicial", "Ref Fam Nombre", "Ref Fam Teléfono",
      "Ref Fam Parentesco", "Ref Fam Ciudad", "Ref Per Nombre", "Ref Per Teléfono",
      "Ref Per Relación", "Ref Per Ciudad", "Firma Ley 1581 (Link PDF Drive)"
    ]);
    sheet.getRange(1, 1, 1, 47).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Respuesta JSON estándar (con headers CORS implícitos de Apps Script)
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
