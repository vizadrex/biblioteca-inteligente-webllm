import { useState, useEffect, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import { useInventory } from '../contexts/InventoryContext';
import type { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useWebLLM = () => {
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  
  const { getInventory, addItem, modifyItemQuantity, deleteItem } = useInventory();
  
  // Use a ref to ensure the engine always has the latest inventory functions
  const inventoryRef = useRef({ getInventory, addItem, modifyItemQuantity, deleteItem });
  useEffect(() => {
    inventoryRef.current = { getInventory, addItem, modifyItemQuantity, deleteItem };
  }, [getInventory, addItem, modifyItemQuantity, deleteItem]);

  const initInProgress = useRef(false);

  useEffect(() => {
    const initEngine = async () => {
      if (initInProgress.current) return;
      initInProgress.current = true;

      try {
        if (!navigator.gpu) {
          setProgress('Tu navegador no soporta WebGPU o está deshabilitado. Prueba en Chrome o Edge (versión reciente).');
          return;
        }

        const initProgressCallback = (report: webllm.InitProgressReport) => {
          setProgress(report.text);
        };

        // Cambiamos a la versión de 1B parámetros que consume mucha menos VRAM y es súper estable
        const selectedModel = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
        
        const newEngine = new webllm.MLCEngine();
        newEngine.setInitProgressCallback(initProgressCallback);
        
        await newEngine.reload(selectedModel);
        setEngine(newEngine);
        setIsReady(true);
        
        // Initial system message
        setMessages([
          {
            id: uuidv4(),
            role: 'system',
            content: `Eres el Bibliotecario Principal de la Universidad Nacional José Faustino Sánchez Carrión (UNJFSC). Gestionas el catálogo de libros automáticamente.
Para ejecutar una acción solicitada por el usuario, DEBES incluir obligatoriamente un bloque JSON al final de tu respuesta con los campos necesarios.
Si el usuario solo hace una pregunta sobre qué libros hay en la biblioteca, mira el [INVENTARIO ACTUAL] que te enviaré y respóndele normalmente SIN usar JSON.
IMPORTANTE: Nunca repitas el texto del inventario actual en tu respuesta.`
          },
          {
            id: uuidv4(),
            role: 'user',
            content: 'Agrega una donación: 5 libros de Cálculo de Stewart'
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content: '¡Claro! He añadido los libros de Cálculo al inventario de la universidad.\n{"accion": "create", "title": "Cálculo", "author": "Stewart", "quantity": 5, "description": "Libro donado"}'
          },
          {
            id: uuidv4(),
            role: 'user',
            content: 'Préstale a un alumno un ejemplar de Física de Serway'
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Préstamo registrado. He reducido el stock.\n{"accion": "decrease", "query": "Serway", "amount": 1}'
          },
          {
            id: uuidv4(),
            role: 'user',
            content: 'Da de baja el libro de Biología'
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Libro eliminado del catálogo.\n{"accion": "delete", "query": "Biología"}'
          }
        ]);
        
      } catch (error) {
        console.error('Error initializing WebLLM:', error);
        const errMessage = error instanceof Error ? error.message : String(error);
        setProgress(`Error al cargar: ${errMessage}`);
      }
    };

    initEngine();
  }, []);

  const sendMessage = async (userText: string) => {
    if (!engine) return;

    const newUserMessage: ChatMessage = { id: uuidv4(), role: 'user', content: userText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Inyectar el inventario actual en el prompt para que el modelo sepa qué hay
      const currentInv = inventoryRef.current.getInventory();
      const inventoryContext = `\n[INVENTARIO ACTUAL: ${JSON.stringify(currentInv)}]`;
      
      let finalUserText = userText;
      const actionKeywords = ['añad', 'agreg', 'pon', 'crea', 'quit', 'elimin', 'reduc', 'baj', 'borr', 'aument', 'sub', 'modific', 'actualiz', 'prest', 'devuel', 'devolv'];
      const wantsAction = actionKeywords.some(kw => userText.toLowerCase().includes(kw));
      
      if (wantsAction) {
        finalUserText += '\n(IMPORTANTE: Ejecuta mi orden y OBLIGATORIAMENTE incluye el bloque JSON {"accion": "...", ...} al final de tu respuesta)';
      }
      
      const apiMessages: webllm.ChatCompletionMessageParam[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      apiMessages.push({ role: 'user', content: finalUserText + inventoryContext });

      const response = await engine.chat.completions.create({
        messages: apiMessages,
        temperature: 0.1
      });

      let finalReply = response.choices[0].message.content || '';
      setDebugLog(finalReply); // Guardar respuesta cruda para debugging

      // Limpiar si la IA alucinó repitiendo el inventario o texto basura
      finalReply = finalReply.replace(/\[INVENTARIO ACTUAL:[\s\S]*/gi, '');
      finalReply = finalReply.replace(/Nota: El inventario actualizado es:[\s\S]*/gi, '');
      finalReply = finalReply.replace(/\[\s*\{\s*"id"[\s\S]*\}\s*\]/g, '');

      // Parsear comandos JSON usando un enfoque tolerante a fallos (action, accion o acción)
      const jsonRegex = /\{[\s\S]*?"acc?i[oó]n"[\s\S]*?\}/i;
      const match = finalReply.match(jsonRegex);

      if (match) {
        try {
          const jsonStr = match[0];
          // Usar Regex para extraer los campos clave para evitar que JSON.parse falle si la IA pone comas al final o se equivoca en la sintaxis
          const accionRaw = (jsonStr.match(/"acc?i[oó]n"\s*:\s*"([^"]+)"/i) || [])[1] || '';
          const accion = accionRaw.toLowerCase();
          const query = (jsonStr.match(/"(?:query|name|id|producto|product|title|titulo|libro|autor|author)"\s*:\s*"([^"]+)"/i) || [])[1] || '';
          const author = (jsonStr.match(/"(?:author|autor)"\s*:\s*"([^"]+)"/i) || [])[1] || '';
          const description = (jsonStr.match(/"(?:description|descripcion|desc)"\s*:\s*"([^"]+)"/i) || [])[1] || '';
          const amountMatch = jsonStr.match(/"(?:amount|quantity|new_quantity|price|cantidad)"\s*:\s*"?([0-9.]+)"?/i);
          const amount = amountMatch ? parseFloat(amountMatch[1]) : 1;

          if (accion === 'create' || accion === 'add' || accion === 'agregar') {
             inventoryRef.current.addItem({
              title: query || 'Nuevo Libro',
              author: author || 'Desconocido',
              quantity: amount,
              description: description
            });
          } else if (accion === 'increase' || accion === 'aumentar') {
            inventoryRef.current.modifyItemQuantity(query, amount, true);
          } else if (accion === 'decrease' || accion === 'reduce' || accion === 'reducir') {
            inventoryRef.current.modifyItemQuantity(query, -amount, true);
          } else if (accion === 'update' || accion === 'actualizar') {
            inventoryRef.current.modifyItemQuantity(query, amount, false);
          } else if (accion === 'delete' || accion === 'eliminar') {
            inventoryRef.current.deleteItem(query);
          }
          
          // Ya NO borramos el JSON del estado 'finalReply' para que la IA lo recuerde en el historial
          // Solo marcamos si el texto quedó vacío o raro
          let uiText = finalReply.replace(match[0], '').trim();
          if (!uiText || uiText === ']') finalReply += ' \n¡Acción realizada con éxito!';
        } catch (e) {
          console.warn('Error en la accion inteligente:', e);
        }
      }

      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'assistant', content: finalReply }
      ]);

    } catch (error: any) {
      console.error('Error during chat:', error);
      const errorMessage = error?.message || String(error);
      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'assistant', content: `Lo siento, ocurrió un error interno: ${errorMessage}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    isReady,
    progress,
    debugLog
  };
};
