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
7. El JSON devuelto debe tener un mensaje cálido y motivador que refleje la estrategia tomada (ej. Modo Acompañamiento, Quick Wins, etc.), una emoción y colores de paleta pastel o calmada (fondos "claro", "oscuro" o "azul_profundo" según sea momento de descanso o enfoque).
18. 8. IMPORTANTE: Para cada tarea, asigna una de estas tres dificultades: "baja", "media" o "alta". Las tareas difíciles/largas deben ser "alta", las medianas "media" y las rápidas/sencillas "baja".`;

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
              tiempo_estimado: { type: Type.STRING },
              dificultad: { type: Type.STRING }
            },
            required: ["titulo", "prioridad", "subpasos", "tiempo_estimado", "dificultad"]
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

export async function getPauvelChatResponse(messages: {role: 'user'|'guide', text: string}[]): Promise<{text: string, mood: 'happy'|'calm'|'focus'}> {
  const formattedMessages = messages.map(m => ({
    role: m.role === 'guide' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));
  
  const chatSystemInstruction = `Eres "Paubéll", un amistoso y motivador asistente de productividad enfocado en el bienestar (Calm Technology).

Tus respuestas deben ser:
- Breves, coherentes y fáciles de entender. ¡Prioriza la claridad sobre la complejidad!
- Rápidas, directas y útiles.

Adapta tu tono según el contexto:
1. Temas emocionales/personales: Sé empático, tranquilo y comprensivo.
2. Temas académicos o cultura general: Sé claro, preciso y estructurado. 
   -> REGLA ESTRICTA: Proporciona respuestas correctas, verificables y añade SIEMPRE las fuentes al final (ej: "Fuentes: ..."). Las fuentes deben ser confiables (artículos académicos, sitios educativos, documentación oficial). NO inventes datos ni enlaces.
3. Tareas/Productividad: Sé práctico, organizado y orientado a la acción. Guía paso a paso, sugiere opciones en lugar de imponer, mantén un tono amable.

EVITA: Respuestas largas innecesarias, lenguaje complicado, tono frío, o inventar fuentes.
FOMENTA: Un lenguaje humano y cercano, explicaciones claras, acompañamiento sin presión. 

IMPORTANTE: Tu respuesta SIEMPRE debe ser un objeto JSON válido con esta estructura exacta (puedes usar Markdown interno para negritas o viñetas en el mensaje):
{
  "mensaje_ia": "Tu respuesta aquí...",
  "emocion_sugerida": "alegre" | "calma" | "enfoque"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: formattedMessages,
    config: {
      systemInstruction: chatSystemInstruction,
      temperature: 0.8,
      responseMimeType: "application/json"
    }
  });

  try {
    let cleanText = response.text || '{}';
    cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanText);
    const moodMap: Record<string, 'happy'|'calm'|'focus'> = {
      'alegre': 'happy',
      'calma': 'calm',
      'enfoque': 'focus'
    };
    return {
      text: data.mensaje_ia || cleanText || "¡Perdona! Me quedé sin palabras.",
      mood: moodMap[data.emocion_sugerida] || 'calm'
    };
  } catch (e) {
    return { text: "¡Perdona! Tuve un problemita procesando eso.", mood: 'calm' };
  }
}

export async function getPauvelEncouragement(projects: string): Promise<string> {
  const prompt = `El usuario tiene estos proyectos finales en progreso: ${projects}. Escribe un mensaje cálido, motivador y breve (estilo Assistant "Paubéll", calm technology), recordándole que va por buen camino y que priorice su bienestar y descansos. Menos de 30 palabras. No uses JSON.`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return response.text || "¡Vas increíble! Respira profundo y sigue así.";
}

export async function getPauvelTip(section: string, career: string): Promise<{text: string, mood: 'happy'|'calm'|'focus'}> {
  const prompt = `Actúa como "Paubéll", un asistente y mascota de productividad amigable.
  El usuario está viendo la sección "${section}" y estudia "${career}".
  Dale un pequeño tip o mensaje de ánimo sobre esa sección, adaptado a su carrera si aplica. Que sea motivador, que priorice el bienestar (no estrés ni burn-out) y muy breve (máximo 2 oraciones cortas).
  Devuelve SOLO formato JSON: {"mensaje": "texto corto", "estado_animo": "happy" o "calm" o "focus"}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || '{}');
    const moodMap: Record<string, 'happy'|'calm'|'focus'> = {
      'happy': 'happy',
      'calm': 'calm',
      'focus': 'focus',
      'alegre': 'happy',
      'calma': 'calm',
      'enfoque': 'focus'
    };
    return {
      text: parsed.mensaje || "Aquí estoy para acompañarte en tus estudios.",
      mood: moodMap[parsed.estado_animo] || 'happy'
    }
  } catch (e) {
    return { text: "Recuerda tomar agüita y respirar profundo.", mood: 'calm' };
  }
}

export async function getSuggestedMaterials(subject: string, career: string): Promise<{name: string, type: 'link'|'file', url: string}[]> {
  const prompt = `Actúa como tutor universitario experto. Sugiere 3 recursos online reales, generales y útiles (links a plataformas educativas, documentación oficial, canales de YouTube educativos, o herramientas) para la materia "${subject}" para un estudiante de "${career}".
Responde SOLO con un array JSON válido sin texto adicional. Formato:
[
  {"name": "Nombre del recurso", "type": "link", "url": "URL sugerida o link de búsqueda en youtube"}
]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Error parsing materials", e);
    return [];
  }
}

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
