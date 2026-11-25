# Plan de adaptación a Venezuela — por módulos, revisión primero

Antes de construir nada, cada módulo se **revisa**. Una revisión es trabajo
read-only: probar lo que hay, compararlo con lo que Venezuela necesita y dejar
un informe con hallazgos priorizados. Sin eso, la planificación de la semana 2
sería adivinar.

## 1. Tablero

| Columna | Regla |
| --- | --- |
| **Por hacer** | 6 tarjetas comprometidas para la semana |
| **En progreso** | **Máximo 6**, una por desarrollador |
| **QA / Revisión** | Se atiende antes de tomar trabajo nuevo |
| **Listo (demo lunes)** | Verificado por otra persona, PR mergeado, funciona en demo |

Si una tarjeta se traba, se marca **BLOQUEADO** y otra persona la destraba antes
de tomar una nueva.

## 2. Qué produce una revisión

Cada revisión entrega **una página** con esta forma:

```md
## Módulo: <nombre>   ·   Revisor: <quien>   ·   Fecha:

### Funciona hoy
- (lo verificado con el sistema abierto, con la ruta exacta)

### No funciona / falta
| # | Hallazgo | Severidad | Evidencia |
|---|----------|-----------|-----------|

### Riesgos para Venezuela
- (lo que puede causar un problema legal, clínico o de dinero)

### Tareas propuestas
| ID | Tarea | Tamaño | Depende de |
|----|-------|--------|------------|
```

**Criterio de salida:** la tabla de tareas propuestas entra tal cual en la
columna "Por hacer" de la semana siguiente.

---

## 3. Módulos

| ID | Módulo | Alcance | Dueño |
| --- | --- | --- | --- |
| **M0** | **Citas y admisión** | agendar, check-in, turno, cola, pase a consulta | |
| **M1** | Identidad del paciente | cédula, nombres, dirección, búsqueda | |
| **M2** | Documentos clínicos | récipe, historia, epicrisis, reposo, referencia | |
| **M3** | Farmacia e inventario | lotes, vencimientos, precios, psicotrópicos | |
| **M4** | Facturación | IVA, IGTF, tasa BCV, formas de pago, caja | |
| **M5** | Laboratorio e imágenes | catálogo, valores de referencia, informes | |
| **M6** | Reportes | morbilidad, egresos, ocupación, agenda del día | |
| **M7** | Operación y seguridad | respaldos, auditoría de HC, roles, cortes | |
| **M8** | Calidad y despliegue | seeds, E2E, CI, runbook | |
| **M9** | Red comunitaria (ASIC) | jerarquía, familia, territorio, referencia, programas | |

> **M9 (ASIC) es estructural**, no una pantalla: cambia la jerarquía
> organizacional y agrega familia y territorio. El análisis completo y las
> tareas están en [`asic-venezuela.md`](./asic-venezuela.md). Antes de
> implementarlo hay que hacer las cinco revisiones `RV-ASIC-01..05`.

---

## 4. Semana 1 — seis revisiones (una por desarrollador)

### RV-01 · M0 Citas y admisión

Probar el circuito completo con el sistema abierto:

- [ ] Agendar una cita nueva para un paciente existente: ¿cuántos pasos y cuánto tarda?
- [ ] Agendar para un paciente **que no existe**: ¿se puede sin ficha completa?
- [ ] Cargar sobrecupo: ¿qué muestra la agenda y qué avisa?
- [ ] Check-in: ¿qué pasa con la cita y con el turno?
- [ ] Cancelar, reprogramar y marcar no asistió: ¿se conserva el historial?
- [ ] Asignar desde lista de espera: ¿existe la pantalla?
- [ ] Cerrar el día: ¿hay algún reporte de agenda?

**Salida esperada:** cuántos pasos reales tiene cada operación y cuáles no
existen. Es el insumo de todo lo demás.

### RV-02 · M1 Identidad del paciente

- [ ] ¿Qué identificadores acepta hoy el sistema y cómo se configuran?
- [ ] ¿Se puede buscar un paciente por cédula desde citas, cola y facturación?
- [ ] ¿Qué pasa si dos pacientes tienen la misma cédula?
- [ ] Dirección: ¿qué campos hay y qué división territorial se puede cargar?
- [ ] ¿Cómo se guardan dos nombres y dos apellidos?

### RV-03 · M3 Farmacia e inventario

- [ ] ¿Cómo se da de alta un medicamento y con qué datos?
- [ ] **¿Existe lote y fecha de vencimiento?** Si no, ¿qué hace hoy el sistema al dispensar?
- [ ] ¿Cómo se registra una existencia y cómo se descuenta al dispensar?
- [ ] ¿Hay alertas de vencimiento próximo o de stock bajo?
- [ ] ¿Se registran devoluciones?

### RV-04 · M4 Facturación

- [ ] ¿Cómo se arma una factura hoy: ítems, cantidades, descuentos?
- [ ] **¿Hay impuestos?** ¿Dónde se calcularía el IVA?
- [ ] ¿En qué moneda se guardan los montos y cómo se muestran?
- [ ] ¿Qué métodos de pago existen y cómo se concilia un pago parcial?
- [ ] ¿Qué pasa al anular una factura?

### RV-05 · M2 Documentos clínicos + M5 Laboratorio

- [ ] ¿Qué plantillas de impresión existen y cómo se configuran por establecimiento?
- [ ] ¿Qué documentos se imprimen hoy y con qué datos?
- [ ] ¿Un informe de laboratorio tiene valores de referencia por sexo y edad?
- [ ] ¿Se puede cargar un catálogo de exámenes propio?
- [ ] ¿El récipe imprime dosis, vía y duración desde la prescripción?

### RV-06 · M9 Red comunitaria (ASIC)

Análisis estructural; el detalle está en [`asic-venezuela.md`](./asic-venezuela.md).

- [ ] ¿El árbol de organizaciones permite MPPS → Región → ASIC → Consultorio?
- [ ] ¿`CareTeam` sirve para el equipo básico por población?
- [ ] ¿`geo_organization` soporta comunidad/sector?
- [ ] ¿`ServiceRequest` alcanza para referencia y contrarreferencia?
- [ ] ¿Qué instrumentos usa realmente la ASIC (hoja diaria, censo, PAI, ENO)?

### RV-07 · M7 Operación y M8 Calidad

- [ ] ¿Qué respaldo existe hoy de la base y quién lo corre?
- [ ] ¿Queda registro de quién abrió una historia clínica?
- [ ] ¿Qué pasa si se corta la luz o la conexión a mitad de una consulta?
- [ ] ¿Cómo se levanta el sistema desde cero en un servidor nuevo? ¿Está escrito?
- [ ] ¿Hay tests automáticos? ¿Corren en cada PR?

---

## 5. Semanas 2 a 4 — implementación por módulo

Las tarjetas salen de los informes de la semana 1. La prioridad se fija en la
reunión del lunes con los hallazgos sobre la mesa. Criterio sugerido:

1. **M0 Citas** — es el flujo que usan todos los días.
2. **M1 Identidad** — bloquea el alta rápida y el check-in.
3. **M3 Farmacia** y **M4 Facturación** — los de mayor riesgo operativo.
4. **M2, M5, M6** — dependen de los anteriores.
5. **M7, M8** — pueden correr en paralelo desde la semana 2 porque no bloquean.

### Lo que ya se sabe que falta (no esperar al informe)

Estos huecos están confirmados en el código y se pueden comprometer desde ya:

| Módulo | Hueco confirmado |
| --- | --- |
| M3 | No existen lote ni vencimiento: el inventario no los modela |
| M4 | No existe ningún impuesto: la factura solo tiene neto y bruto |
| M1 | La cédula no es identificador de primera clase |
| M6 | No hay reportes de morbilidad ni de agenda |

**Ya resuelto, no replanificar:** interfaz en español, fechas en español,
CIE-10 con 14.484 diagnósticos y búsqueda en español, impresión de turnos en
A4/58 mm/80 mm/100×150, escaneo con cámara o lector, login institucional.

---

## 6. Riesgos de hacer revisión primero

- **Cuesta una semana sin código nuevo.** Se compensa porque evita construir
  sobre supuestos: la mitad del plan anterior asumía que faltaba más de lo que
  en realidad falta (sobrecupo, lista de espera y reconsulta ya existen).
- **Un revisor por módulo es un cuello de botella** si alguien no entrega. La
  salida es de una página, no un documento largo.
- **El informe no reemplaza la demo del lunes:** se muestra el sistema abierto.

## 7. Decisiones pendientes

1. **¿Cédula obligatoria para agendar?** Define el alcance de M1.
2. **¿La institución factura con IVA?** Define si M4 arranca por impuestos.
3. **¿Qué documentos exige el MPPS** en este establecimiento? Define M2.
4. **¿Quién es el revisor de cada módulo?** Se asigna en la reunión del lunes.
