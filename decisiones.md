## Por qué Git no pudo resolver el conflicto solo: 
Git no pudo resolverlo solo porque al modificar la misma parte del archivo mediante las ramas A y B, este no es capaz de decidir que version es la correcta,
se necesita una resolucion manual. El conflicto no hubiera existido si el cambio se hacia en archivos diferentes o si se trabaja desde una misma rama.

## Qué problemas encontraste:
El primer problema fue que el push al main fue rechazado porque el repositorio remoto tenia cambios que mi repositorio local todavía no tenia. Y el segundo problema 
fue que no podia mergear la rama B. Lo resolví mirando los marcadores de conflicto, eligiendo cual seria el contenido/version final y recién ahi hacer merge.

## Declaración de uso de IA: 
Por el momento no use la IA.
