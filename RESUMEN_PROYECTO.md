# Landing Page y Solicitud Bancaria — Crédito Vehicular

## Descripción general
Plataforma web de captación y radicación de créditos vehiculares (carros y motocicletas) en Colombia, compuesta por dos páginas principales:
1. `index.html`: Formulario inicial de captación rápida de leads.
2. `solicitud-detallada.html`: Formulario bancario completo para la radicación detallada del crédito con autocompletado y firma digital PDF bajo la Ley 1581 de 2012.

Los datos de ambas páginas se gestionan centralizadamente en un mismo libro de **Google Sheets** mediante un backend unificado en **Google Apps Script** (`code.gs`).

---

## Archivos del proyecto
- `index.html` — Formulario inicial rápido (captación de lead, evaluación preliminar de ingresos y redirección a WhatsApp).
- `solicitud-detallada.html` — Formulario avanzado para estudio bancario (autocompletado por documento, datos laborales/vivienda/referencias y módulo de firma PDF Ley 1581 de 2012).
- `code.gs` — Backend en Google Apps Script que maneja el almacenamiento en Sheets (`Leads` y `SolicitudesDetalladas`) y la consulta de autocompletado vía GET por `numDoc`.
- `RESUMEN_PROYECTO.md` — Documentación central del sistema.

---

## Funcionalidades Clave

### 1. Formulario Inicial (`index.html`)
- Identidad de marca **La Llave Motor** con contenedor de logo.
- Captación rápida de datos personales y financieros básicos.
- Evaluación automática de viabilidad en cliente (Ingresos > $2.700.000 + Demuestra ingresos).
- Redirección automática a WhatsApp.
- Botón flotante de ayuda directa por WhatsApp ("Hola, necesito ayuda de un asesor").

### 2. Formulario Detallado Bancario (`solicitud-detallada.html`)
- **Autocompletado con Google Sheets:** Al ingresar el número de documento en la barra de búsqueda superior y hacer clic en "Cargar mis datos", la página consulta a Apps Script (`doGet?numDoc=...`) y completa automáticamente los campos recopilados previamente.
- **Información Requerida por Bancos:**
  - *Sección 1:* Tipo/Número Doc, Nombre completo, Fecha/Lugar expedición, Fecha nacimiento, Edad, Estado civil, Nivel educativo, Personas a cargo.
  - *Sección 2:* Teléfono, Email, Dirección, Ciudad, Departamento, Tipo de vivienda, Antigüedad en vivienda, Canon de arriendo/hipoteca.
  - *Sección 3:* Tipo de contrato, Empresa, Cargo, Fecha de Vinculación Laboral, Antigüedad laboral, Teléfono/Dirección empresa, Ingresos básicos, Otros ingresos, Egresos mensuales.
  - *Sección 4:* Vehículo (Carro/Moto), Estado (Nuevo/Usado), Marca, Línea, Año modelo, Valor total y Cuota inicial aportada.
  - *Sección 5:* Referencia Familiar (no conviviente) y Referencia Personal (Nombre, teléfono, parentesco/relación, ciudad).
  - *Sección 6:* Autorización de datos y consulta en Centrales de Riesgo (Ley 1581 de 2012).
- **Firma Digital & Almacenamiento Automático en Google Drive:**
  - Canvas interactivo multitouch/mouse para trazado de firma digital.
  - Al enviar la solicitud, la firma trazada se convierte a imagen base64 y se envía a Google Apps Script (`code.gs`).
  - Apps Script compila automáticamente el PDF con el encabezado de la Ley 1581 de 2012, los datos del titular y la firma trazada, guardándolo en la carpeta de Google Drive `Firmas_Creditos_Vehiculares`.
  - El enlace directo al PDF en Google Drive se inserta automáticamente en la hoja `SolicitudesDetalladas` de Google Sheets para consulta o envío posterior al asesor del banco.

---

## Backend — `code.gs`

### Endpoint POST (`doPost(e)`)
- Si `data.tipoFormulario === 'detallado'`:
  - Llama a `saveSignaturePdfToDrive_(data, fechaHoraLocal)` para convertir el HTML + Firma a PDF y almacenarlo en la carpeta de Google Drive `Firmas_Creditos_Vehiculares`.
  - Guarda los 47 campos (incluyendo Fecha de Vinculación y el Link del PDF en Drive) en la hoja `SolicitudesDetalladas`.
- En caso contrario, guarda los datos en la hoja `Leads`.
- Crea automáticamente las hojas y encabezados si no existen previamente en el documento de Google Sheets.

### Endpoint GET (`doGet(e)`)
- Si recibe `?numDoc=XXXXX`, realiza la búsqueda del lead más reciente en la hoja `Leads` por número de documento.
- Retorna un JSON con `{ result: "found", lead: { ... } }` o `{ result: "not_found" }`.
- Soporta lectura de CORS nativa desde el navegador.

---

## Estructura de Google Sheets

### Hoja `Leads`
`Fecha/Hora, Nombre, Tipo Doc, Número Doc, Teléfono, Email, Edad, Vehículo, Monto Financiar, Ocupación, Ingresos Mensuales, Demuestra Ingresos, Obligaciones Financieras, Paz y Salvo`

### Hoja `SolicitudesDetalladas`
`Fecha/Hora, Nombre Completo, Tipo Doc, Número Doc, Fecha Exp Doc, Lugar Exp Doc, Fecha Nacimiento, Estado Civil, Nivel Estudios, Personas A Cargo, Teléfono, Email, Edad, Dirección Residencia, Ciudad, Departamento, Tipo Vivienda, Tiempo Residencia, Canon/Hipoteca, Tipo Contrato, Empresa/Negocio, Cargo/Actividad, Fecha Vinculación, Antigüedad Laboral, Teléfono Empresa, Dirección Empresa, Ingreso Básico, Otros Ingresos, Concepto Otros Ingresos, Egresos Mensuales, Tipo Vehículo, Estado Vehículo, Marca, Línea/Modelo, Año Modelo, Concesionario, Valor Vehículo, Cuota Inicial, Ref Fam Nombre, Ref Fam Teléfono, Ref Fam Parentesco, Ref Fam Ciudad, Ref Per Nombre, Ref Per Teléfono, Ref Per Relación, Ref Per Ciudad, Firma Ley 1581 (Link PDF Drive)`

---

## Configuración Actual
- **APPS_SCRIPT_URL:** `https://script.google.com/macros/s/AKfycby4TkISKEjjFPZNpXTw1Ebfa4VQdfSGSxZXqY_py3lszgmczXdl8RsTVTJl1bvQpoDv3A/exec`
- **WHATSAPP_NUMBER:** `573182754224`

---

## Notas de despliegue y actualización
- **Actualizar Apps Script:** Tras modificar `code.gs`, se debe realizar un redeploy en Google Apps Script: *Implementar > Gestionar implementaciones > Editar > Nueva versión > Desplegar*.
- **Permisos de Google Drive:** Al redeployar con el nuevo código, Google Apps Script solicitará autorización para acceder a Google Drive (`DriveApp`). Debes otorgar los permisos para que pueda crear la carpeta `Firmas_Creditos_Vehiculares` y guardar los PDFs automáticamente.
- **CORS & Seguridad:** Los envíos `POST` utilizan `mode: 'no-cors'` para evitar bloqueos del navegador con Apps Script. Los envíos `GET` de búsqueda utilizan el `ContentService` nativo de Apps Script.

