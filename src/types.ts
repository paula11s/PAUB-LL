export interface PauvelResponse {
  interaccion: {
    mensaje_ia: string;
    emocion_sugerida: string;
    frase_motivacional: string;
  };
  analisis_logico: {
    categoria: string;
    tareas: {
      titulo: string;
      prioridad: string;
      subpasos: string[];
      tiempo_estimado: string;
    }[];
    alertas_bienestar: {
      tipo: string;
      hora: string;
      mensaje: string;
    };
  };
  estetica_interfaz: {
    color_enfasis: string;
    fondo_sugerido: string;
  };
}
