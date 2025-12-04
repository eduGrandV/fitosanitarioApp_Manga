import * as Location from "expo-location";
import { Alert } from "react-native";
import { PontoLocalizacao } from "../data/daodaAvaliacao";

export async function Gps() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permissão de Localização negada!");
    return null;
  }

  const loc = await Location.getCurrentPositionAsync({});
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy, // precisão horizontal
    altitudeAccuracy: loc.coords.altitudeAccuracy, // precisão da altitude
    heading: loc.coords.heading, // direção do dispositivo
    speed: loc.coords.speed, // velocidade em m/s
    timestamp: loc.timestamp, // hora  da coleta
  };
}

// Função para bucar a loc na hora de marcar

const criarPontoLocalizacao = (
  lote: string,
  { latitude, longitude }: { latitude: number; longitude: number }
): PontoLocalizacao => ({
  id: Date.now(),
  lote,
  latitude,
  longitude,
  timestamp: Date.now(),
});

export const obterLocalizacaoComTime = async (
  lote: string,
  timeoutMs = 5000
): Promise<PontoLocalizacao> => {
  const localizacaoPadrao = {
    latitude: -9.287495,
    longitude: -40.878419,
  };
  try {
    //permissão
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn(
        "Permissão de localização negada, usando coordenadas padrão."
      );
      return criarPontoLocalizacao(lote, localizacaoPadrao);
    }

    // promessa para tentar pegar a posição
    const posicaoPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
      mayShowUserSettingsDialog: false,
    });

    //timeout de 3 segundos
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout ao buscar localização")),
        timeoutMs
      )
    );

    //espera qual vem primeiro
    const posicao = await Promise.race([posicaoPromise, timeoutPromise]);

    //se der certo
    return criarPontoLocalizacao(lote, {
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
    });
  } catch (error) {
    console.warn("Erro ao obter localização:", error);

    //se falhar, loc padrão
    return criarPontoLocalizacao(lote, localizacaoPadrao);
  }
};
