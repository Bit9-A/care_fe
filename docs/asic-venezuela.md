# ASIC: cómo funcionan y qué tiene que cambiar en el sistema

El primer nivel de atención venezolano no está organizado por “hospital” sino por
**territorio y población**. Eso choca con la estructura actual del sistema, que
asume establecimientos independientes. Este documento analiza el modelo y
propone la adaptación.

## 1. Cómo funciona una ASIC

El **Área de Salud Integral Comunitaria** es la unidad organizativa del primer
nivel del Sistema Público Nacional de Salud. No es un edificio: es un
**territorio con población asignada** y un equipo de salud responsable de esa
población.

```
MPPS  (nacional)
 └── Autoridad Regional de Salud  (estadal)
      └── ASIC  (territorio + población)
           ├── Consultorios Populares
           ├── CDI   (Centro de Diagnóstico Integral)
           ├── SRI   (Sala de Rehabilitación Integral)
           ├── Laboratorio / Farmacia / Odontología
           └── Equipo básico de salud
```

**Lo que distingue a una ASIC de un ambulatorio:**

| Rasgo | Consecuencia para el sistema |
| --- | --- |
| Cubre una **población asignada**, no la demanda espontánea | Hace falta registrar familias y territorio, y medir cobertura |
| **Capta** activamente (censo, visita casa por casa, pesquisa) | El paciente no siempre “llega”: hay que registrarlo sin consulta |
| La consulta es **por orden de llegada**, sin hora | El turno es diario por consultorio, no una cita con cupo |
| Ejecuta **programas** (inmunizaciones, prenatal, crónicos, ENO) | Cada programa tiene seguimiento y reporte propio |
| **Refiere** al segundo nivel y recibe la **contrareferencia** | Hace falta una entidad de referencia con retorno |
| Reporta al nivel regional | Reportes con la estructura de la ASIC, no por establecimiento |

## 2. Mapeo con el modelo actual

| Pieza de la ASIC | Equivalente en el sistema | Brecha |
| --- | --- | --- |
| MPPS / Autoridad Regional / ASIC | `Organization` (árbol genérico con `parent` y `level_cache`) | El árbol existe y sirve; faltan los tipos y los datos |
| Consultorio Popular | `Facility` con `facility_type` | **No existe el tipo** “Consultorio Popular” ni “ASIC” en el catálogo |
| CDI / SRI | `Facility` | CDI existe (`1010`); SRI no (hay “CRI”, `1500`) |
| Equipo básico de salud | `CareTeam` / `healthcare_service` | Existe, pero no está ligado a una población |
| Territorio y comunidad | `geo_organization` + `address` | El árbol territorial **no está cargado**; no hay “comunidad/sector” |
| **Familia / núcleo familiar** | — | **No existe**: el paciente es individual y suelto |
| Censo / captación sin consulta | — | No hay registro de familia ni de visita domiciliaria |
| Programa (PAI, prenatal, crónicos, ENO) | cuestionarios + observaciones | No hay programa con seguimiento, metas ni reporte |
| **Referencia y contrarreferencia** | `ServiceRequest` genérico (FHIR) | No tiene destino, estado de retorno ni contrarreferencia |
| Hoja diaria de consulta | reportes | **No existe** |
| Reporte a la región | reportes | **No existe** |

## 3. La adaptación estructural propuesta

### 3.1 Jerarquía organizacional

Usar el árbol de `Organization` que ya existe, con tres niveles explícitos:

```
Organization (org_type = govt)
  MPPS
   └── Autoridad Regional de Salud (Táchira)
        └── ASIC «Nombre del territorio»
             └── (opcional) Equipo básico / Consultorio
```

y colgar cada `Facility` (consultorio popular, CDI, SRI) de la ASIC que le
corresponde. **No hace falta un modelo nuevo**: hace falta declarar el tipo,
cargar el árbol y validar que un establecimiento tenga ASIC.

### 3.2 Catálogo de establecimientos

Agregar a `FACILITY_TYPES`, en el bloque de primer nivel (`8xx`):

- `804` **ASIC** (sede administrativa de la ASIC, si la tiene)
- `805` **Consultorio Popular**
- `806` **Sala de Rehabilitación Integral (SRI)**

CDI, ambulatorio rural/urbano, casa de la mujer y laboratorio ya están.

### 3.3 Familia y territorio (lo único realmente nuevo)

Dos entidades que hoy no existen:

1. **Núcleo familiar**: agrupa pacientes, con dirección, jefe de familia,
   número de integrantes y ASIC asignada. Es lo que permite el censo y la
   visita domiciliaria.
2. **Comunidad/sector** dentro de la ASIC: el nivel territorial por debajo de la
   parroquia, que es donde se asignan las familias.

Sin esto, la ASIC no puede hacer su trabajo: no se puede captar ni medir
cobertura de una población que el sistema no conoce.

### 3.4 Referencia y contrarreferencia

Una entidad con: paciente, origen (ASIC/consultorio), destino (hospital),
motivo CIE-10, prioridad, estado (`emitida → aceptada → atendida → contrarreferida`),
y el documento de retorno con indicaciones. Hoy `ServiceRequest` puede guardar
el pedido, pero no el circuito de vuelta, que es lo que el primer nivel necesita.

### 3.5 Programas sanitarios

Un “programa” es un paciente inscrito con controles periódicos y metas: PAI
(esquema y dosis), control prenatal (captación, controles, riesgo), crónicos
(HTA, diabetes), tuberculosis, ENO (notificación semanal obligatoria). Se apoya
en cuestionarios y observaciones, pero necesita **inscripción, recordatorio de
próximo control y reporte**.

## 4. Tareas

### Revisión (semana 1)

| ID | Tarea | Criterio de salida |
| --- | --- | --- |
| RV-ASIC-01 | Verificar el árbol de `Organization`: ¿se puede crear MPPS → Región → ASIC → Consultorio y colgar establecimientos? | Sí / no, con la ruta y las limitaciones encontradas |
| RV-ASIC-02 | Verificar `CareTeam` y `healthcare_service`: ¿sirven para modelar el equipo básico por población? | Sí / no, con datos que faltan |
| RV-ASIC-03 | Verificar `geo_organization`: niveles, carga del territorio y si soporta comunidad/sector | Estructura real y qué falta |
| RV-ASIC-04 | Verificar `ServiceRequest`: ¿alcanza para referencia? ¿qué falta para la contrarreferencia? | Lista de campos faltantes |
| RV-ASIC-05 | Relevar con el establecimiento los instrumentos reales (hoja diaria, censo, tarjetero PAI, ENO) | Formatos concretos a replicar |

### Implementación (semanas 2 a 4)

| ID | Módulo | Tarea | Tamaño | Depende de |
| --- | --- | --- | --- | --- |
| AS-01 | M9 | Tipos nuevos en el catálogo: ASIC, Consultorio Popular, SRI | S | RV-ASIC-01 |
| AS-02 | M9 | Jerarquía ASIC cargada y validada (un establecimiento no queda sin ASIC) | M | AS-01 |
| AS-03 | M9 | Núcleo familiar: modelo, alta y vínculo con pacientes | L | RV-ASIC-03 |
| AS-04 | M9 | Comunidad/sector dentro de la ASIC y asignación de familias | M | AS-02, AS-03 |
| AS-05 | M9 | Referencia y contrarreferencia con circuito completo e impresión | L | RV-ASIC-04 |
| AS-06 | M9 | Turno diario por consultorio sin cita previa (orden de llegada) | S | — |
| AS-07 | M9 | Inscripción a programas y próximo control | M | AS-03 |
| AS-08 | M6 | Hoja diaria de consulta por consultorio | M | — |
| AS-09 | M6 | Reporte de cobertura por ASIC (familias, embarazadas, inmunizados) | L | AS-03, AS-07 |
| AS-10 | M6 | ENO: notificación semanal obligatoria | M | AS-07 |

## 5. Riesgos

- **La ASIC no es un establecimiento**: si se modela como `Facility` se duplica
  la realidad y los reportes salen mal. Va como `Organization`.
- **El núcleo familiar es la pieza más cara** (AS-03) y toca pacientes,
  direcciones, reportes y permisos. Es donde conviene hacer una prueba con datos
  reales de una ASIC antes de generalizar.
- **La contrarreferencia depende del hospital**: si el segundo nivel no la
  registra, el circuito queda a medias. Hay que acordar con el hospital que
  recibe.
- **Los instrumentos reales mandan**: los formatos de hoja diaria y censo deben
  salir del establecimiento, no de un supuesto.

## 6. Decisiones

1. **¿Una ASIC puede tener varios `Facility`?** (consultorio + CDI + SRI en el
   mismo territorio) — si sí, ASIC es `Organization`; si no, alcanza con un tipo
   de establecimiento.
2. **¿Se registra la familia completa o solo el paciente índice?** Define el
   alcance de AS-03.
3. **¿Qué programas son obligatorios** reportar en este estado?
4. **¿El hospital de referencia va a usar el mismo sistema** para la
   contrarreferencia?
