# 📚 Biblioteca Inteligente — IA en el navegador (WebLLM)

Aplicación web que gestiona el inventario de una biblioteca universitaria con ayuda de un **asistente de IA que corre 100% en tu navegador**, sin servidores, sin API keys y sin enviar datos a internet.

Desarrollado como proyecto académico para la **Universidad Nacional José Faustino Sánchez Carrión (UNJFSC)**.

## ¿Qué hace?

- Muestra y administra el catálogo de libros de la biblioteca (agregar, editar, eliminar, controlar stock).
- Incluye un **chat con un "Bibliotecario IA"**: le escribes en lenguaje natural cosas como *"registra una donación de 5 libros de Cálculo de Stewart"* o *"préstale un Serway a un alumno"* y la IA **ejecuta la acción de verdad** sobre el inventario.
- Todo se guarda en `localStorage`, así que el catálogo persiste entre sesiones.

## ¿Cómo funciona la IA?

Lo interesante del proyecto es que **no usa ninguna API de pago**:

1. Con [WebLLM](https://github.com/mlc-ai/web-llm) se descarga el modelo **Llama 3.2 1B Instruct** (cuantizado) y se ejecuta directamente en la GPU de tu navegador vía **WebGPU**.
2. En cada mensaje se le inyecta al modelo el inventario actual como contexto.
3. Cuando pides una acción, el modelo responde con un bloque JSON (`{"accion": "create", ...}`) que la aplicación interpreta y ejecuta sobre el estado de React.

Es, en esencia, un mini **agente de IA con herramientas**, implementado a mano.

## Tecnologías

- **React 19 + TypeScript + Vite**
- **@mlc-ai/web-llm** — inferencia LLM en el navegador (WebGPU)
- Context API de React para el estado del inventario
- CSS propio (sin frameworks de UI)

## Requisitos

- Node.js 18+
- Un navegador con **WebGPU** (Chrome o Edge recientes)
- La primera carga descarga el modelo (~700 MB) y puede tardar; luego queda en caché del navegador.

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

Abre http://localhost:5173, espera a que el modelo termine de cargar (verás el progreso en el chat) y prueba por ejemplo:

- *"¿Qué libros de física tenemos?"*
- *"Agrega 10 ejemplares de Redes de Computadoras de Tanenbaum"*
- *"Da de baja el libro de Biología"*

## Estructura del proyecto

```
src/
├── components/
│   ├── AIChat.tsx          # Chat con el bibliotecario IA
│   └── InventoryList.tsx   # Tabla/las tarjetas del catálogo
├── contexts/
│   └── InventoryContext.tsx # Estado global del inventario + persistencia
├── hooks/
│   └── useWebLLM.ts        # Carga del modelo, prompts y parseo de acciones JSON
└── types/                  # Tipos compartidos (Book, ChatMessage, ...)
```

## Lo que aprendí con este proyecto

- Ejecutar modelos de lenguaje **localmente en el navegador** con WebGPU y sus limitaciones reales (VRAM, tamaño del modelo, calidad vs. velocidad).
- Diseñar prompts con **few-shot examples** para que un modelo pequeño (1B) responda con JSON estructurado de forma confiable.
- Conectar la salida de un LLM con acciones reales de la aplicación (patrón agente + herramientas).
