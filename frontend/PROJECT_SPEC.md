# Sistema de Ventas Multiempresa

## Descripción General
Plataforma de compra y venta de artículos y servicios con sistema de moderación para garantizar la seguridad y calidad de las publicaciones.

---

## Roles

### Compradores/Visualizadores
- Visualizar listado de artículos
- Obtener más información de artículos
- Filtrar por categoría y precio
- Marcar artículos como "me interesa" (guardados)

### Vendedores
- Subir artículos con información completa (descripción, precio, fotos, disponibilidad)
- Editar publicaciones
- Eliminar publicaciones
- Apelar decisiones de moderación

### Moderadores
- Dar seguimiento a artículos peligrosos o no aptos
- Detectar automáticamente o manualmente artículos problemáticos
- Suspender o reactivar cuentas de vendedores y compradores
- Revisar reportes de compradores
- Tomar decisiones finales sobre apelaciones

### Administrador
- Registrar moderadores
- Asumir los mismos roles del moderador

---

## Funcionalidades

### Gestión de Productos/Servicios
- **CRUD**: Crear, modificar, eliminar, visualizar
- **Estados**: Cambiar estado de visualización
- **Apelaciones**: Permitir solicitud de revisión si se rechaza un producto
- **Detección automática**: El sistema detecta productos no permitidos y los oculta
- **Reportes**: Compradores y moderadores pueden reportar productos
- **Guardados**: Los usuarios pueden marcar productos como "me interesa"

#### Restricciones de Productos
- No se puede eliminar un producto detectado como peligroso
- Desaparece automáticamente de la visualización de vendedores y compradores
- Permanece visible solo para moderadores en revisión
- Aplica igual para servicios

#### Lógica de Reportes
- **Reporte automático del sistema**: Se oculta automáticamente
- **Reporte de comprador**: No se desactiva automáticamente, requiere revisión de moderador
- El moderador toma la decisión final

### Gestión de Usuarios

#### Registro
- Compradores y vendedores pueden registrarse
- Requiere correo electrónico válido
- Solo un usuario por correo
- Validación de correo electrónico obligatoria
- Contraseñas encriptadas
- Contraseñas fuertes requeridas

#### Recuperación de Contraseña
- Disponible para compradores y vendedores

#### Gestión de Cuentas
- Moderadores registrados solo por administrador
- Moderadores y administrador pueden activar/desactivar cuentas

### Gestión de Incidencias/Reportes

#### Módulo de Incidencias
- Visualización de productos/servicios detectados por el sistema
- Filtrado por fechas
- Registro automático del moderador que revisa
- Cambio de estado de visualización desde este módulo
- Sección separada para reportes de compradores

#### Reportes de Compradores
- Incluyen tipo de reporte
- Incluyen comentario opcional

#### Apelaciones
- Vendedor puede apelar decisión de moderación
- Debe indicar motivos
- Reactiva la incidencia
- Será revisada por un moderador diferente
- El moderador diferente toma la decisión final

---

## Restricciones del Sistema

### Seguridad
- Detección de productos/servicios prohibidos
- Encriptación de contraseñas
- Contraseñas fuertes obligatorias
- Un usuario por correo
- Registro solo con correo válido
- Registro completo al verificar cuenta

### Funcionalidad
- Registro se completa cuando se verifica la cuenta
- Sistema responsivo (mobile-friendly)
- Sistema ocultará/suspenderá publicaciones con tiempo determinado en plataforma (configurable por administrador)
- Diseño adecuado: colores y distribución para buena interacción

---

## Información a Manejar

### Usuarios
- Cédula
- Nombre
- Apellido
- Correo
- Teléfono
- Dirección
- Género

### Productos
- Código
- Nombre
- Descripción
- Fotos (1 a 5)
- Precio
- Ubicación
- Disponibilidad
- Tipo
- Estado
- Fecha de publicación

### Servicios
- Horario de atención
- Mismo esquema que productos

### Incidencias
- Fecha de incidencia
- Estado
- Descripción
- Moderador encargado
- Vendedor que solicita (si aplica)

---

## Funcionalidades Opcionales (Por Seleccionar)

- **Chat con vendedor**: Permitir comunicación entre compradores y vendedores
  - Incluir sistema de valoración del vendedor
  
- **Filtrado por ubicación**: Definir ubicación del producto
  - Permitir filtrado de productos según ubicación del vendedor
  - Basado en geolocalización

---

## Notas Técnicas

- Sistema multiempresa (multi-tenant)
- Detección automática de productos prohibidos (validar implementación)
- Auditoría de cambios por moderador
- Estados de productos con lógica de visibilidad
- Apelaciones con reasignación a moderador diferente