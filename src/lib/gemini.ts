import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PauvelResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `Eres "Paubéll", un asistente de productividad basado en el "Presupuesto Energético Dinámico" y enfocado en bienestar.
Tu objetivo principal es adaptar las responsabilidades del usuario a su nivel de energía y ánimo actual (Calm Technology), alejándote por completo del estrés y la productividad tóxica.

REGLAS CLAVE Y SISTEMA DE GESTIÓN ENERGÉTICA:
1. Clasifica las tareas cruzando siempre dos variables: Nivel de Energía y Fecha de Entrega (Urgencia).
2. ESCENARIO DE REORGANIZACIÓN (Con tiempo): Si la energía es baja y no hay entregas urgentes hoy, desplaza las tareas complejas al final o a otro día. Prioriza "Quick Wins" (tareas mecánicas fáciles).
3. ESCENARIO DE EMERGENCIA (Sin tiempo): Si hay una entrega apremiante hoy y la energía es baja o inestable, NO CANCELES LA TAREA. Activa explícitamente el "Modo Acompañamiento": Sugiere metodología Pomodoro (25/5), propón técnica de "Esqueleto" (Mínimo Producto Viable), e inserta recordatorios obligatorios de descanso corto en los subpasos o como alerta.
4. Si el usuario reporta energía ALTA o motivación: propón rutinas profundas y retos estimulantes, aprovechando su estado al máximo.
5. Aplica "Divulgación Progresiva": No satures con una lista enorme (máximo 2 a 4 tareas), enfócate en el "Aquí y Ahora".
6. REORGANIZA Y ORDENA ESTRICTAMENTE las tareas desde la de mayor prioridad e importancia hasta la de menor prioridad. La primera tarea debe ser siempre la más crítica.
7. El JSON devuelto debe tener un mensaje cálido y motivador que refleje la estrategia tomada (ej. Modo Acompañamiento, Quick Wins, etc.), una emoción y colores de paleta pastel o calmada (fondos "claro", "oscuro" o "azul_profundo" según sea momento de descanso o enfoque).`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    interaccion: {
      type: Type.OBJECT,
      properties: {
        mensaje_ia: { type: Type.STRING },
        emocion_sugerida: { type: Type.STRING },
        frase_motivacional: { type: Type.STRING }
      },
      required: ["mensaje_ia", "emocion_sugerida", "frase_motivacional"]
    },
    analisis_logico: {
      type: Type.OBJECT,
      properties: {
        categoria: { type: Type.STRING },
        tareas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              titulo: { type: Type.STRING },
              prioridad: { type: Type.STRING },
              subpasos: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              tiempo_estimado: { type: Type.STRING }
            },
            required: ["titulo", "prioridad", "subpasos", "tiempo_estimado"]
          }
        },
        alertas_bienestar: {
          type: Type.OBJECT,
          properties: {
            tipo: { type: Type.STRING },
            hora: { type: Type.STRING },
            mensaje: { type: Type.STRING }
          },
          required: ["tipo", "hora", "mensaje"]
        }
      },
      required: ["categoria", "tareas", "alertas_bienestar"]
    },
    estetica_interfaz: {
      type: Type.OBJECT,
      properties: {
        color_enfasis: { type: Type.STRING },
        fondo_sugerido: { type: Type.STRING }
      },
      required: ["color_enfasis", "fondo_sugerido"]
    }
  },
  required: ["interaccion", "analisis_logico", "estetica_interfaz"]
};

export async function getPauvelPlan(prompt: string, energia: string, animo: string): Promise<PauvelResponse> {
  const fullPrompt = `[Check-in de Bienestar del Usuario]
- Nivel de Energía: ${energia}
- Estado de Ánimo: ${animo}

[Responsabilidades o ideas a gestionar hoy]
${prompt || "Solamente quiero organizarme"}

Genera el plan de "Aquí y Ahora" aplicando tu Presupuesto Energético Dinámico. Si su energía es baja o hay agotamiento, sé sumamente compasivo, prioriza que recargue batería y da pasos mínimos minimizando la culpa. Si es alta o media positiva, guíalo con ímpetu.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    }
  });
  
  const text = response.text;
  if (!text) {
    throw new Error("No hubo respuesta de la IA.");
  }
  
  return JSON.parse(text) as PauvelResponse;
}
