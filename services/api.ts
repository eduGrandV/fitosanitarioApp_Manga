import { Alert } from "react-native";
import { Registro } from "../data/daodaAvaliacao";

export const SincronizarBanco = async (avaliacoes: Registro[]) => {
  try {
    const response = await fetch("http://192.168.253.9:3001/plantas/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        avaliacoes.map((av) => ({
          planta: av.planta,
          lote: av.lote,
          doencaOuPraga: av.doencaOuPraga,
          orgao: av.orgao,
          quadrante: av.quadrante || null,
          ramo: av.ramo || null,
          numeroLocal: av.numeroLocal || null,
          local:
            typeof av.local === "object" && av.local !== null
              ? { latitude: av.local.latitude, longitude: av.local.longitude } 
              : null,
          nota: av.nota,
          centroCusto: av.centroCusto,
          nomeAvaliador: av.nomeAvaliador,
        }))
      ),
    });
    if (!response.ok) {
      throw new Error(`Erro ao enviar Dados: ${response.statusText}`);
    }

    const dados = await response.json();
    Alert.alert(
      "✅ Sucesso",
      "Todas as avaliações foram enviadas para o servidor!"
    );
    return dados;
  } catch (error: any) {
    console.error("erro na sincronização:  ", error),
      Alert.alert(
        "❌ Falha",
        `Não foi possível enviar os dados: ${error.message}`
      );
  }
};
